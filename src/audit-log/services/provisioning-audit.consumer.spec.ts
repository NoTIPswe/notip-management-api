import { describe, expect, it, jest } from '@jest/globals';
import { ProvisioningAuditConsumer } from './provisioning-audit.consumer';
import { MockJetStreamClient } from '../../command/nats/mock-jetstream.client';
import { AuditLogService } from './audit.service';

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

describe('ProvisioningAuditConsumer', () => {
  it('subscribes and persists a valid provisioning audit event', async () => {
    const jetStream = new MockJetStreamClient();
    const { auditLog, logAuditEvent } = createAuditLogMock();

    const consumer = new ProvisioningAuditConsumer(jetStream, auditLog);
    await consumer.onModuleInit();

    await jetStream.emit(
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
    const jetStream = new MockJetStreamClient();
    const { auditLog, logAuditEvent } = createAuditLogMock();

    const consumer = new ProvisioningAuditConsumer(jetStream, auditLog);
    await consumer.onModuleInit();

    await jetStream.emit(
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
    const jetStream = new MockJetStreamClient();
    const { auditLog, logAuditEvent } = createAuditLogMock();

    const consumer = new ProvisioningAuditConsumer(jetStream, auditLog);
    await consumer.onModuleInit();

    await jetStream.emit(
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
