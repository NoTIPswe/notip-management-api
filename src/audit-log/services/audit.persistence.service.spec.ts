import { AuditLogPersistenceService } from './audit.persistence.service';

describe('AuditLogPersistenceService', () => {
  it('builds a query with optional filters', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 'audit-1' }]),
    };
    const repo = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    };
    const service = new AuditLogPersistenceService(repo as never);

    await expect(
      service.getAuditLogs({
        tenantId: 'tenant-1',
        from: new Date('2024-01-01T00:00:00.000Z'),
        to: new Date('2024-01-02T00:00:00.000Z'),
        userId: 'user-1',
        action: 'gateway.updated',
      }),
    ).resolves.toEqual([{ id: 'audit-1' }]);

    expect(query.where).toHaveBeenCalled();
    expect(query.andWhere).toHaveBeenCalledTimes(4);
    expect(query.orderBy).toHaveBeenCalledWith('audit_log.timestamp', 'DESC');
    expect(query.addOrderBy).toHaveBeenCalledWith('audit_log.id', 'DESC');
  });

  it('skips optional filters when they are absent', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const repo = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    };
    const service = new AuditLogPersistenceService(repo as never);

    await service.getAuditLogs({
      tenantId: 'tenant-1',
      from: new Date('2024-01-01T00:00:00.000Z'),
      to: new Date('2024-01-02T00:00:00.000Z'),
    });

    expect(query.andWhere).toHaveBeenCalledTimes(2);
    expect(query.orderBy).toHaveBeenCalledWith('audit_log.timestamp', 'DESC');
    expect(query.addOrderBy).toHaveBeenCalledWith('audit_log.id', 'DESC');
  });
});
