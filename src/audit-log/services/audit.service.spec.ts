import { AuditLogService } from './audit.service';
import { AuditLogPersistenceService } from './audit.persistence.service';

const createAuditEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'audit-1',
  tenantId: 'tenant-1',
  userId: 'user-1',
  action: 'gateway.updated',
  resource: 'gateway',
  details: { name: 'Gateway A' },
  timestamp: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('AuditLogService', () => {
  it('returns mapped audit logs', async () => {
    const getAuditLogs = jest.fn().mockResolvedValue([createAuditEntity()]);
    const persistence = {
      getAuditLogs,
    } as unknown as AuditLogPersistenceService;
    const service = new AuditLogService(persistence);

    await expect(
      service.getAuditLogs({
        tenantId: 'tenant-1',
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

    expect(getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1' }),
    );
  });

  it('logs audit event', async () => {
    const mockEntity = { id: 'new-audit' };
    const persistence = {
      createAuditLog: jest.fn().mockReturnValue(mockEntity),
      saveAuditLog: jest.fn().mockResolvedValue(mockEntity),
    } as unknown as AuditLogPersistenceService;
    const service = new AuditLogService(persistence);

    const input = {
      userId: 'u1',
      action: 'act',
      resource: 'res',
      details: { d: 'd' },
      tenantId: 't1',
    };

    await service.logAuditEvent(input);

    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(persistence.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        action: 'act',
        resource: 'res',
        details: { d: 'd' },
        tenantId: 't1',
        timestamp: expect.any(Date) as unknown as Date,
      }),
    );
    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(persistence.saveAuditLog).toHaveBeenCalledWith(mockEntity);
  });
});
