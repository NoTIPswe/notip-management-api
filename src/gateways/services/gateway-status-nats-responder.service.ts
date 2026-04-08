import {
  Injectable,
  Logger,
  NotFoundException,
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
const GATEWAY_GET_STATUS_SUBJECT = 'internal.mgmt.gateway.get-status';

type GatewayStatusUpdateResponse =
  | { success: true }
  | {
      success: false;
      error: 'INVALID_PAYLOAD' | 'NOT_FOUND' | 'INTERNAL';
    };

type GatewayGetStatusResponse = {
  gateway_id: string;
  state: 'online' | 'offline' | 'paused' | 'provisioning';
};

@Injectable()
export class GatewayStatusNatsResponderService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(GatewayStatusNatsResponderService.name);
  private readonly codec = JSONCodec<unknown>();
  private connection: NatsConnection | null = null;
  private subscriptions: Subscription[] = [];

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

    const updateSubscription = this.connection.subscribe(
      GATEWAY_STATUS_UPDATE_SUBJECT,
    );
    this.subscriptions.push(updateSubscription);
    this.logger.log(
      `Subscribed to NATS request-reply subject: ${GATEWAY_STATUS_UPDATE_SUBJECT}`,
    );
    void this.consumeRequests(updateSubscription, async (msg) =>
      this.handleUpdate(msg),
    );

    const getStatusSubscription = this.connection.subscribe(
      GATEWAY_GET_STATUS_SUBJECT,
    );
    this.subscriptions.push(getStatusSubscription);
    this.logger.log(
      `Subscribed to NATS request-reply subject: ${GATEWAY_GET_STATUS_SUBJECT}`,
    );
    void this.consumeRequests(getStatusSubscription, async (msg) =>
      this.handleGetStatus(msg),
    );
  }

  async onModuleDestroy(): Promise<void> {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions = [];

    if (this.connection) {
      await this.connection.drain();
      await this.connection.close();
      this.connection = null;
    }
  }

  private async consumeRequests<TResponse>(
    subscription: Subscription,
    handler: (msg: Msg) => Promise<TResponse>,
  ): Promise<void> {
    for await (const msg of subscription) {
      if (!msg.reply) {
        this.logger.warn(
          `Received request on ${msg.subject} without a reply subject`,
        );
        continue;
      }

      let response: TResponse | { success: false; error: 'INTERNAL' };
      try {
        response = await handler(msg);
      } catch (error) {
        this.logger.error(
          `Unhandled NATS request handler error on ${msg.subject}`,
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

  private async handleGetStatus(msg: Msg): Promise<GatewayGetStatusResponse> {
    const payload = this.decodeRecord(msg);
    const gatewayId = this.readNonEmptyString(payload, 'gateway_id');
    const tenantId = this.readNonEmptyString(payload, 'tenant_id');

    if (!gatewayId || !tenantId) {
      this.logger.warn('Invalid gateway get-status payload received');
      return {
        gateway_id: gatewayId ?? '',
        state: 'offline',
      };
    }

    try {
      const gateway = await this.gatewaysService.findById({
        gatewayId,
        tenantId,
      });

      return {
        gateway_id: gatewayId,
        state: this.toLifecycleState(gateway.status),
      };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Failed to resolve lifecycle state for gateway ${gatewayId}`,
          error as Error,
        );
      }

      return {
        gateway_id: gatewayId,
        state: 'offline',
      };
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

  private readNonEmptyString(
    value: Record<string, unknown> | null,
    key: string,
  ): string | null {
    const raw = value?.[key];
    return typeof raw === 'string' && raw.trim().length > 0 ? raw : null;
  }

  private normalizeStatus(value: unknown): GatewayStatus | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase().replaceAll(/[\s-]/g, '_');
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

  private toLifecycleState(
    status?: GatewayStatus,
  ): 'online' | 'offline' | 'paused' | 'provisioning' {
    switch (status) {
      case GatewayStatus.GATEWAY_ONLINE:
        return 'online';
      case GatewayStatus.GATEWAY_SUSPENDED:
        return 'paused';
      case GatewayStatus.GATEWAYS_PROVISIONING:
        return 'provisioning';
      case GatewayStatus.GATEWAY_OFFLINE:
      default:
        return 'offline';
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
