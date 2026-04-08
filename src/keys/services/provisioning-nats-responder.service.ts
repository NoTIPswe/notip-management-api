import {
  HttpException,
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
import { KeysService } from './keys.service';

type ValidateFactoryResponse =
  | {
      gateway_id: string;
      tenant_id: string;
    }
  | {
      error: 'INVALID' | 'ALREADY_PROVISIONED' | 'INTERNAL';
    };

type CompleteProvisioningResponse =
  | { success: true }
  | { success: false; error: 'NOT_FOUND' | 'INTERNAL' };

@Injectable()
export class ProvisioningNatsResponderService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ProvisioningNatsResponderService.name);
  private readonly codec = JSONCodec<unknown>();
  private connection: NatsConnection | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(private readonly keysService: KeysService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.MOCK_NATS !== 'false') {
      this.logger.log(
        'Skipping provisioning NATS responders because MOCK_NATS is not false',
      );
      return;
    }

    const servers = this.resolveServers();
    this.connection = await connect(this.buildConnectionOptions(servers));
    this.logger.log(
      `Provisioning responders connected to NATS servers: ${servers.join(', ')}`,
    );

    this.startResponder('internal.mgmt.factory.validate', async (msg) =>
      this.handleValidate(msg),
    );

    this.startResponder('internal.mgmt.provisioning.complete', async (msg) =>
      this.handleComplete(msg),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeConnection();
  }

  private startResponder(
    subject: string,
    handler: (msg: Msg) => Promise<unknown>,
  ): void {
    if (!this.connection) {
      return;
    }

    const subscription = this.connection.subscribe(subject);
    this.subscriptions.push(subscription);
    this.logger.log(`Subscribed to NATS request-reply subject: ${subject}`);

    void (async () => {
      for await (const msg of subscription) {
        if (!msg.reply) {
          this.logger.warn(
            `Received request on ${subject} without a reply subject`,
          );
          continue;
        }

        let response: unknown;
        try {
          response = await handler(msg);
        } catch (error) {
          this.logger.error(
            `Unhandled NATS request handler error on ${subject}`,
            error as Error,
          );
          response = this.internalErrorResponse(subject);
        }

        this.connection?.publish(msg.reply, this.codec.encode(response));
      }
    })();
  }

  private async handleValidate(msg: Msg): Promise<ValidateFactoryResponse> {
    const payload = this.decodeRecord(msg);
    if (!payload) {
      return { error: 'INVALID' };
    }

    const factoryID = payload.factory_id;
    const factoryKey = payload.factory_key;
    if (
      !this.isNonEmptyString(factoryID) ||
      !this.isNonEmptyString(factoryKey)
    ) {
      return { error: 'INVALID' };
    }

    try {
      const result = await this.keysService.validateFactoryKey(
        factoryID,
        factoryKey,
      );

      return {
        gateway_id: result.gatewayId,
        tenant_id: result.tenantId,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        if (status === 401) {
          return { error: 'INVALID' };
        }
        if (status === 409) {
          return { error: 'ALREADY_PROVISIONED' };
        }
      }

      this.logger.error('Factory validation failed', error as Error);
      return { error: 'INTERNAL' };
    }
  }

  private async handleComplete(
    msg: Msg,
  ): Promise<CompleteProvisioningResponse> {
    const payload = this.decodeRecord(msg);
    if (!payload) {
      return { success: false, error: 'INTERNAL' };
    }

    const gatewayID = payload.gateway_id;
    const keyMaterial = payload.key_material;
    const keyVersion = payload.key_version;
    const sendFrequencyMs = payload.send_frequency_ms;
    const firmwareVersion = payload.firmware_version;

    if (
      !this.isNonEmptyString(gatewayID) ||
      !this.isNonEmptyString(keyMaterial) ||
      !this.isFiniteNumber(keyVersion) ||
      !this.isFiniteNumber(sendFrequencyMs) ||
      sendFrequencyMs <= 0 ||
      !this.isOptionalString(firmwareVersion)
    ) {
      return { success: false, error: 'INTERNAL' };
    }

    try {
      await this.keysService.completeProvisioning(
        gatewayID,
        keyMaterial,
        keyVersion,
        sendFrequencyMs,
        firmwareVersion,
      );
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        if (status === 404) {
          return { success: false, error: 'NOT_FOUND' };
        }
      }

      this.logger.error('Provisioning completion failed', error as Error);
      return { success: false, error: 'INTERNAL' };
    }
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

  private internalErrorResponse(subject: string): unknown {
    if (subject === 'internal.mgmt.provisioning.complete') {
      return { success: false, error: 'INTERNAL' };
    }
    return { error: 'INTERNAL' };
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private isOptionalString(value: unknown): value is string | undefined {
    return value === undefined || typeof value === 'string';
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
      name: process.env.NATS_CLIENT_NAME ?? 'management-api-provisioning-rr',
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
    this.logger.log('Using mTLS for provisioning NATS responders');
    return true;
  }

  private async closeConnection(): Promise<void> {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions.length = 0;

    if (this.connection) {
      await this.connection.drain();
      await this.connection.close();
    }

    this.connection = null;
  }
}
