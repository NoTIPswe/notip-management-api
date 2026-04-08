import { AuditLogController } from './audit.controller';
import { AuditLogService } from '../services/audit.service';

describe('AuditLogController', () => {
  it('returns mapped audit log responses', async () => {
    const timestamp = new Date('2024-01-01T00:00:00.000Z');
    const getAuditLogs = jest.fn().mockResolvedValue([
      {
        id: 'audit-1',
        action: 'gateway.updated',
        userId: 'user-1',
        timestamp,
        details: { name: 'Gateway A' },
        resource: 'gateway',
      },
    ]);
    const service = {
      getAuditLogs,
    } as unknown as AuditLogService;
    const controller = new AuditLogController(service);

    await expect(
      controller.getAuditLogs(
        'tenant-1',
        timestamp,
        timestamp,
        'user-1',
        'gateway.updated',
      ),
    ).resolves.toEqual([
      {
        id: 'audit-1',
        action: 'gateway.updated',
        userId: 'user-1',
        timestamp: timestamp.toISOString(),
        details: { name: 'Gateway A' },
        resource: 'gateway',
      },
    ]);

    expect(getAuditLogs).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      from: timestamp,
      to: timestamp,
      userId: 'user-1',
      action: 'gateway.updated',
    });
  });

  it('returns "-" as userId for provisioning audit logs', async () => {
    const timestamp = new Date('2024-01-01T00:00:00.000Z');
    const getAuditLogs = jest.fn().mockResolvedValue([
      {
        id: 'audit-2',
        action: 'PROVISIONING_ONBOARD_SUCCESS',
        userId: '00000000-0000-0000-0000-000000000000',
        timestamp,
        details: { sourceSubject: 'log.audit.tenant-1' },
        resource: 'gw-1',
      },
    ]);
    const service = {
      getAuditLogs,
    } as unknown as AuditLogService;
    const controller = new AuditLogController(service);

    await expect(
      controller.getAuditLogs('tenant-1', timestamp, timestamp),
    ).resolves.toEqual([
      {
        id: 'audit-2',
        action: 'PROVISIONING_ONBOARD_SUCCESS',
        userId: '-',
        timestamp: timestamp.toISOString(),
        details: { sourceSubject: 'log.audit.tenant-1' },
        resource: 'gw-1',
      },
    ]);
  });
});
