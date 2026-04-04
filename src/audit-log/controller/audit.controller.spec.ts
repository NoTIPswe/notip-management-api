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
});
