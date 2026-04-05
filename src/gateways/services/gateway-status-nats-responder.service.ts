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
  Msg,
  NatsConnection,
  Subscription,
} from 'nats';
import { GatewayStatus } from '../enums/gateway.enum';
import { GatewaysService } from './gateways.service';

const GATEWAY_STATUS_UPDATE_SUBJECT = 'internal.mgmt.gateway.update-status';

type GatewayStatusUpdateResponse =
  | { success: true }
  | {
      success: false;
      error: 'INVALID_PAYLOAD' | 'NOT_FOUND' | 'INTERNAL';
    };

@Injectable()
export class GatewayStatusNatsResponderService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(GatewayStatusNatsResponderService.name);
  private readonly codec = JSONCodec<unknown>();
  private connection: NatsConnection | null = null;
  private subscription: Subscription | null = null;

  constructor(private readonly gatewaysService: GatewaysService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.MOCK_NATS !== 'false') {
      this.logger.log(
        'Skipping gateway status NATS responder because MOCK_NATS is not false',
      );
      return;
    }

    const servers = this.resolveServers();
    this.connection = await connect(this.buildConnectionOptions(servers));
    this.logger.log(
      `Gateway status responder connected to NATS servers: ${servers.join(', ')}`,
    );

    this.subscription = this.connection.subscribe(
      GATEWAY_STATUS_UPDATE_SUBJECT,
    );
    this.logger.log(
      `Subscribed to NATS request-reply subject: ${GATEWAY_STATUS_UPDATE_SUBJECT}`,
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
          `Received request on ${GATEWAY_STATUS_UPDATE_SUBJECT} without a reply subject`,
        );
        continue;
      }

      let response: GatewayStatusUpdateResponse;
      try {
        response = await this.handleUpdate(msg);
      } catch (error) {
        this.logger.error(
          `Unhandled NATS request handler error on ${GATEWAY_STATUS_UPDATE_SUBJECT}`,
          error as Error,
        );
        response = { success: false, error: 'INTERNAL' };
      }

      this.connection?.publish(msg.reply, this.codec.encode(response));
    }
  }

  private async handleUpdate(msg: Msg): Promise<GatewayStatusUpdateResponse> {
    const payload = this.decodeRecord(msg);
    if (!payload) {
      return { success: false, error: 'INVALID_PAYLOAD' };
    }

    const gatewayId = payload.gateway_id;
    const status = this.normalizeStatus(payload.status);
    const lastSeenAt = this.parseTimestamp(payload.last_seen_at);

    if (!this.isNonEmptyString(gatewayId) || !status || !lastSeenAt) {
      return { success: false, error: 'INVALID_PAYLOAD' };
    }

    const updated = await this.gatewaysService.updateGatewayRuntimeStatus(
      gatewayId,
      status,
      lastSeenAt,
    );

    if (!updated) {
      return { success: false, error: 'NOT_FOUND' };
    }

    return { success: true };
  }

  private decodeRecord(msg: Msg): Record<string, unknown> | null {
    try {
      const decoded = this.codec.decode(msg.data);
      if (typeof decoded !== 'object' || decoded === null) {
        return null;
      }

      return decoded as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private normalizeStatus(value: unknown): GatewayStatus | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase().replace(/[\s-]/g, '_');
    switch (normalized) {
      case 'online':
      case 'gateway_online':
        return GatewayStatus.GATEWAY_ONLINE;
      case 'offline':
      case 'gateway_offline':
        return GatewayStatus.GATEWAY_OFFLINE;
      case 'paused':
      case 'suspended':
      case 'gateway_suspended':
        return GatewayStatus.GATEWAY_SUSPENDED;
      default:
        return null;
    }
  }

  private parseTimestamp(value: unknown): Date | null {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return null;
    }

    const timestamp = new Date(value);
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
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
      name: process.env.NATS_CLIENT_NAME ?? 'management-api-gateway-status-rr',
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
    this.logger.log('Using mTLS for gateway status NATS responder');
    return true;
  }
}
