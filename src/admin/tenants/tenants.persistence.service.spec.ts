import { TenantsPersistenceService } from './tenants.persistence.service';

describe('TenantsPersistenceService', () => {
  it('returns tenants from the repository', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([{ id: 'tenant-1' }]),
    };
    const service = new TenantsPersistenceService(repo as never);

    await expect(service.getTenants()).resolves.toEqual([{ id: 'tenant-1' }]);
  });

  it('creates and saves a tenant', async () => {
    const tenant = { name: 'Tenant One' };
    const repo = {
      create: jest.fn().mockReturnValue(tenant),
      save: jest.fn().mockResolvedValue({ id: 'tenant-1', ...tenant }),
    };
    const service = new TenantsPersistenceService(repo as never);

    await expect(service.createTenant({ name: 'Tenant One' })).resolves.toEqual(
      {
        id: 'tenant-1',
        name: 'Tenant One',
      },
    );
    expect(repo.create).toHaveBeenCalledWith({ name: 'Tenant One' });
  });

  it('updates an existing tenant', async () => {
    const existing = { id: 'tenant-1', name: 'Old' };
    const savedTenant = { id: 'tenant-1', name: 'New', status: undefined };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(existing),
      save: jest.fn().mockResolvedValue(savedTenant),
    };
    const service = new TenantsPersistenceService(repo as never);

    await expect(
      service.updateTenant({ id: 'tenant-1', name: 'New', status: undefined }),
    ).resolves.toEqual(expect.objectContaining({ name: 'New' }));
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tenant-1', name: 'New' }),
    );
  });

  it('returns null when updating a missing tenant', async () => {
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const service = new TenantsPersistenceService(repo as never);

    await expect(
      service.updateTenant({ id: 'tenant-1', name: 'New', status: undefined }),
    ).resolves.toBeNull();
  });

  it('returns true when a tenant was deleted', async () => {
    const repo = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const service = new TenantsPersistenceService(repo as never);

    await expect(service.deleteTenant({ id: 'tenant-1' })).resolves.toBe(true);
  });

  it('returns false when no tenant was deleted', async () => {
    const repo = {
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
    };
    const service = new TenantsPersistenceService(repo as never);

    await expect(service.deleteTenant({ id: 'tenant-1' })).resolves.toBe(false);
  });
});
