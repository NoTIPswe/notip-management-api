import { AuditLogController } from './audit.controller';
import { AuditLogService } from '../services/audit.service';

describe('AuditLogController', () => {
  it('returns mapped audit log responses', async () => {
    const timestamp = new Date('2024-01-01T00:00:00.000Z');
    const service = {
      getAuditLogs: jest.fn().mockResolvedValue([
        {
          id: 'audit-1',
          action: 'gateway.updated',
          userId: 'user-1',
          timestamp,
          details: '{"name":"Gateway A"}',
          resource: 'gateway',
        },
      ]),
    } as unknown as AuditLogService;
    const controller = new AuditLogController(service);

    await expect(
      controller.getAuditLogs(
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
        timestamp,
        details: '{"name":"Gateway A"}',
        resource: 'gateway',
      },
    ]);
  });
});
