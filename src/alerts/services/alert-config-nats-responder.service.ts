import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  connect,
  ConnectionOptions,
  JSONCodec,
  NatsConnection,
  Subscription,
} from 'nats';
import { AlertsPersistenceService } from './alerts.persistence.service';

const ALERT_CONFIGS_LIST_SUBJECT = 'internal.mgmt.alert-configs.list';

interface AlertConfigResponse {
  tenant_id: string;
  gateway_id?: string;
  timeout_ms: number;
}

@Injectable()
export class AlertConfigNatsResponderService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AlertConfigNatsResponderService.name);
  private readonly codec = JSONCodec<unknown>();
  private connection: NatsConnection | null = null;
  private subscription: Subscription | null = null;

  constructor(
    private readonly alertsPersistenceService: AlertsPersistenceService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.MOCK_NATS !== 'false') {
      this.logger.log(
        'Skipping alert config NATS responder because MOCK_NATS is not false',
      );
      return;
    }

    const servers = this.resolveServers();
    this.connection = await connect(this.buildConnectionOptions(servers));
    this.logger.log(
      `Alert config responder connected to NATS servers: ${servers.join(', ')}`,
    );

    this.subscription = this.connection.subscribe(ALERT_CONFIGS_LIST_SUBJECT);
    this.logger.log(
      `Subscribed to NATS request-reply subject: ${ALERT_CONFIGS_LIST_SUBJECT}`,
    );

    void this.consumeRequests(this.subscription);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.connection) {
      await this.connection.drain();
      await this.connection.close();
      this.connection = null;
    }
  }

  private async consumeRequests(subscription: Subscription): Promise<void> {
    for await (const msg of subscription) {
      if (!msg.reply) {
        this.logger.warn(
          `Received request on ${ALERT_CONFIGS_LIST_SUBJECT} without a reply subject`,
        );
        continue;
      }

      let response: AlertConfigResponse[];
      try {
        const configs =
          await this.alertsPersistenceService.findAllAlertConfigs();
        response = configs.map((c) => ({
          tenant_id: c.tenantId,
          ...(c.gatewayId == null ? {} : { gateway_id: c.gatewayId }),
          timeout_ms: c.gatewayTimeoutMs,
        }));
      } catch (error) {
        this.logger.error(
          `Failed to fetch alert configs for NATS response on ${ALERT_CONFIGS_LIST_SUBJECT}`,
          error as Error,
        );
        response = [];
      }

      this.connection?.publish(msg.reply, this.codec.encode(response));
    }
  }

  private resolveServers(): string[] {
    const raw = process.env.NATS_SERVERS ?? process.env.NATS_URL;
    if (!raw) {
      return ['nats://localhost:4222'];
    }

    return raw
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  private buildConnectionOptions(servers: string[]): ConnectionOptions {
    const options: ConnectionOptions = {
      servers,
      name: process.env.NATS_CLIENT_NAME ?? 'management-api-alert-config-rr',
    };

    const tlsEnabled = this.applyTlsOptions(options);
    const token = process.env.NATS_TOKEN?.trim();
    const user = process.env.NATS_USER?.trim();
    const pass = process.env.NATS_PASSWORD?.trim();

    if (token) {
      options.token = token;
      return options;
    }

    if (user && pass) {
      options.user = user;
      options.pass = pass;
      return options;
    }

    if (!tlsEnabled) {
      this.logger.log('Using unauthenticated NATS connection');
    }

    return options;
  }

  private applyTlsOptions(options: ConnectionOptions): boolean {
    const caFile = process.env.NATS_TLS_CA;
    const certFile = process.env.NATS_TLS_CERT;
    const keyFile = process.env.NATS_TLS_KEY;

    if (!(caFile && certFile && keyFile)) {
      return false;
    }

    options.tls = {
      caFile,
      certFile,
      keyFile,
    };
    this.logger.log('Using mTLS for alert config NATS responder');
    return true;
  }
}
