import { describe, expect, it, jest } from '@jest/globals';
import { ProvisioningAuditConsumer } from './provisioning-audit.consumer';
import { AuditLogService } from './audit.service';
import { JetStreamClient, JetStreamHandler } from '../../nats/jetstream.client';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const TENANT_ID = '11111111-1111-4111-8111-111111111111';
type LogAuditEventFn = AuditLogService['logAuditEvent'];

const createAuditLogMock = (): {
  auditLog: AuditLogService;
  logAuditEvent: jest.MockedFunction<LogAuditEventFn>;
} => {
  const logAuditEvent = jest.fn<LogAuditEventFn>().mockResolvedValue(undefined);
  return {
    auditLog: { logAuditEvent } as unknown as AuditLogService,
    logAuditEvent,
  };
};

const createMockJetStream = (): {
  jetStream: JetStreamClient;
  handlers: Map<string, JetStreamHandler>;
  emit: (payload: unknown, subject: string) => Promise<void>;
} => {
  const handlers = new Map<string, JetStreamHandler>();
  const jetStream = {
    subscribe: jest.fn(
      (_stream: string, subject: string, handler: JetStreamHandler) => {
        handlers.set(subject, handler);
        return Promise.resolve();
      },
    ),
    subscribeCore: jest.fn(),
    publish: jest.fn(),
    request: jest.fn(),
  } as unknown as JetStreamClient;
  const emit = async (payload: unknown, subject: string) => {
    const handler = handlers.get('log.audit.>');
    if (handler) {
      await handler({
        data: Buffer.from(JSON.stringify(payload)),
        subject,
        ack: () => {},
      });
    }
  };
  return { jetStream, handlers, emit };
};

describe('ProvisioningAuditConsumer', () => {
  it('subscribes and persists a valid provisioning audit event', async () => {
    const { jetStream, emit } = createMockJetStream();
    const { auditLog, logAuditEvent } = createAuditLogMock();

    const consumer = new ProvisioningAuditConsumer(jetStream, auditLog);
    await consumer.onModuleInit();

    await emit(
      {
        userId: 'service:provisioning',
        action: 'PROVISIONING_ONBOARD_SUCCESS',
        resource: 'gw-1',
        details: {
          tenantId: TENANT_ID,
          outcome: 'success',
        },
        timestamp: '2024-01-02T00:00:00.000Z',
      },
      `log.audit.${TENANT_ID}`,
    );

    expect(logAuditEvent).toHaveBeenCalledWith({
      userId: SYSTEM_USER_ID,
      action: 'PROVISIONING_ONBOARD_SUCCESS',
      resource: 'gw-1',
      tenantId: TENANT_ID,
      details: expect.objectContaining({
        outcome: 'success',
        sourceSubject: `log.audit.${TENANT_ID}`,
      }),
    });
  });

  it('skips messages with invalid tenant metadata', async () => {
    const { jetStream, emit } = createMockJetStream();
    const { auditLog, logAuditEvent } = createAuditLogMock();

    const consumer = new ProvisioningAuditConsumer(jetStream, auditLog);
    await consumer.onModuleInit();

    await emit(
      {
        userId: SYSTEM_USER_ID,
        action: 'PROVISIONING_ONBOARD_ERROR',
        resource: 'factory-1',
        details: {
          tenantId: 'not-a-uuid',
        },
        timestamp: '2024-01-02T00:00:00.000Z',
      },
      'log.audit.not-a-uuid',
    );

    expect(logAuditEvent).not.toHaveBeenCalled();
  });

  it('uses tenantId from payload details when subject tenant is invalid', async () => {
    const { jetStream, emit } = createMockJetStream();
    const { auditLog, logAuditEvent } = createAuditLogMock();

    const consumer = new ProvisioningAuditConsumer(jetStream, auditLog);
    await consumer.onModuleInit();

    await emit(
      {
        userId: SYSTEM_USER_ID,
        action: 'PROVISIONING_ONBOARD_ALREADY_PROVISIONED',
        resource: 'factory-1',
        details: {
          tenantId: TENANT_ID,
        },
        timestamp: '2024-01-02T00:00:00.000Z',
      },
      'log.audit.not-a-uuid',
    );

    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID }),
    );
  });
});
