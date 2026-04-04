import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  JetStreamClient,
  JetStreamMessage,
} from '../../command/nats/jetstream.client';
import { AuditLogService } from './audit.service';

const PROVISIONING_AUDIT_SUBJECT = 'log.audit.>';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AuditPayload = {
  userId?: unknown;
  action?: unknown;
  resource?: unknown;
  details?: unknown;
  timestamp?: unknown;
};

@Injectable()
export class ProvisioningAuditConsumer implements OnModuleInit {
  private readonly logger = new Logger(ProvisioningAuditConsumer.name);

  constructor(
    private readonly jetStreamClient: JetStreamClient,
    private readonly auditLogService: AuditLogService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.jetStreamClient.subscribe(
      PROVISIONING_AUDIT_SUBJECT,
      async (msg) => {
        await this.processMessage(msg);
      },
    );

    this.logger.log(
      `Listening for provisioning audit events on ${PROVISIONING_AUDIT_SUBJECT}`,
    );
  }

  private async processMessage(message: JetStreamMessage): Promise<void> {
    const payload = this.parsePayload(message.data);
    if (!payload) {
      await Promise.resolve(message.ack());
      return;
    }

    const action = this.asNonEmptyString(payload.action);
    const resource = this.asNonEmptyString(payload.resource);
    const timestamp = this.parseTimestamp(payload.timestamp);
    const tenantId = this.resolveTenantId(message.subject, payload.details);

    if (!action || !resource || !timestamp || !tenantId) {
      this.logger.warn(
        'Skipping provisioning audit event with invalid metadata',
      );
      await Promise.resolve(message.ack());
      return;
    }

    const userId = this.resolveUserId(payload.userId);
    const details = this.toDetailsObject(payload.details, message.subject);

    try {
      await this.auditLogService.logAuditEvent({
        userId,
        action,
        resource,
        tenantId,
        details,
      });
      await Promise.resolve(message.ack());
    } catch (error) {
      this.logger.error(
        'Failed to persist provisioning audit event',
        error as Error,
      );
    }
  }

  private parsePayload(buffer: Buffer): AuditPayload | null {
    try {
      const parsed = JSON.parse(buffer.toString('utf-8')) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        this.logger.warn(
          'Skipping provisioning audit event with non-object body',
        );
        return null;
      }
      return parsed as AuditPayload;
    } catch {
      this.logger.warn('Skipping provisioning audit event with invalid JSON');
      return null;
    }
  }

  private resolveTenantId(
    subject: string | undefined,
    details: unknown,
  ): string | undefined {
    const fromSubject = this.extractTenantFromSubject(subject);
    if (fromSubject && this.isUuid(fromSubject)) {
      return fromSubject;
    }

    if (!details || typeof details !== 'object') {
      return undefined;
    }

    const detailMap = details as Record<string, unknown>;
    const fromDetails =
      this.asNonEmptyString(detailMap.tenantId) ??
      this.asNonEmptyString(detailMap.tenant_id);

    if (fromDetails && this.isUuid(fromDetails)) {
      return fromDetails;
    }

    return undefined;
  }

  private extractTenantFromSubject(subject?: string): string | undefined {
    if (!subject) {
      return undefined;
    }

    const parts = subject.split('.');
    if (parts.length < 3 || parts[0] !== 'log' || parts[1] !== 'audit') {
      return undefined;
    }

    return parts[2];
  }

  private resolveUserId(value: unknown): string {
    const candidate = this.asNonEmptyString(value);
    if (candidate && this.isUuid(candidate)) {
      return candidate;
    }

    return SYSTEM_USER_ID;
  }

  private parseTimestamp(value: unknown): Date | undefined {
    const input = this.asNonEmptyString(value);
    if (!input) {
      return undefined;
    }

    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed;
  }

  private toDetailsObject(
    value: unknown,
    subject: string | undefined,
  ): Record<string, unknown> {
    const details: Record<string, unknown> =
      value && typeof value === 'object'
        ? ({ ...(value as Record<string, unknown>) } as Record<string, unknown>)
        : {};

    if (subject) {
      details.sourceSubject = subject;
    }

    return details;
  }

  private asNonEmptyString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private isUuid(value: string): boolean {
    return UUID_REGEX.test(value);
  }
}
