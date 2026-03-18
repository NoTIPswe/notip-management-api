import { AuditLogService } from './audit.service';
import { AuditLogPersistenceService } from './audit.persistence.service';

const createAuditEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'audit-1',
  tenantId: 'tenant-1',
  userId: 'user-1',
  action: 'gateway.updated',
  resource: 'gateway',
  details: '{"name":"Gateway A"}',
  timestamp: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('AuditLogService', () => {
  it('returns mapped audit logs', async () => {
    const persistence = {
      getAuditLogs: jest.fn().mockResolvedValue([createAuditEntity()]),
    } as unknown as AuditLogPersistenceService;
    const service = new AuditLogService(persistence);

    await expect(
      service.getAuditLogs({
        from: new Date('2024-01-01T00:00:00.000Z'),
        to: new Date('2024-01-02T00:00:00.000Z'),
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'audit-1',
        action: 'gateway.updated',
        userId: 'user-1',
      }),
    ]);
  });
});
