import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantStatus } from '../../common/enums/tenants.enum';
import { TenantsService } from './tenants.service';
import { TenantsPersistenceService } from './tenants.persistence.service';

const createTenantEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'tenant-1',
  name: 'Tenant One',
  status: TenantStatus.ACTIVE,
  suspensionIntervalDays: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
  ...overrides,
});

describe('TenantsService', () => {
  it('returns mapped tenants', async () => {
    const persistence = {
      getTenants: jest.fn().mockResolvedValue([createTenantEntity()]),
    } as unknown as TenantsPersistenceService;
    const service = new TenantsService(persistence);

    await expect(service.getTenants()).resolves.toEqual([
      expect.objectContaining({
        id: 'tenant-1',
        name: 'Tenant One',
        status: TenantStatus.ACTIVE,
      }),
    ]);
  });

  it('creates a tenant', async () => {
    const persistence = {
      createTenant: jest.fn().mockResolvedValue(createTenantEntity()),
    } as unknown as TenantsPersistenceService;
    const service = new TenantsService(persistence);

    await expect(
      service.createTenant({
        name: 'Tenant One',
        adminEmail: 'admin@example.com',
        adminName: 'Admin User',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'tenant-1',
        name: 'Tenant One',
      }),
    );
  });

  it('maps unique violations during tenant creation', async () => {
    const persistence = {
      createTenant: jest.fn().mockRejectedValue({ code: '23505' }),
    } as unknown as TenantsPersistenceService;
    const service = new TenantsService(persistence);

    await expect(
      service.createTenant({
        name: 'Tenant One',
        adminEmail: 'admin@example.com',
        adminName: 'Admin User',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates a tenant', async () => {
    const persistence = {
      updateTenant: jest.fn().mockResolvedValue(createTenantEntity()),
    } as unknown as TenantsPersistenceService;
    const service = new TenantsService(persistence);

    await expect(
      service.updateTenant({
        id: 'tenant-1',
        name: 'Tenant One',
        status: TenantStatus.SUSPENDED,
        suspensionIntervalDays: 30,
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'tenant-1' }));
  });

  it('throws when updating a missing tenant', async () => {
    const persistence = {
      updateTenant: jest.fn().mockResolvedValue(null),
    } as unknown as TenantsPersistenceService;
    const service = new TenantsService(persistence);

    await expect(
      service.updateTenant({
        id: 'tenant-1',
        name: 'Tenant One',
        status: TenantStatus.SUSPENDED,
        suspensionIntervalDays: 30,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('maps unique violations during tenant updates', async () => {
    const persistence = {
      updateTenant: jest.fn().mockRejectedValue({ code: '23505' }),
    } as unknown as TenantsPersistenceService;
    const service = new TenantsService(persistence);

    await expect(
      service.updateTenant({
        id: 'tenant-1',
        name: 'Tenant One',
        status: TenantStatus.SUSPENDED,
        suspensionIntervalDays: 30,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws when deleting a missing tenant', async () => {
    const persistence = {
      deleteTenant: jest.fn().mockResolvedValue(false),
    } as unknown as TenantsPersistenceService;
    const service = new TenantsService(persistence);

    await expect(service.deleteTenant({ id: 'tenant-1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolves when deleting an existing tenant', async () => {
    const persistence = {
      deleteTenant: jest.fn().mockResolvedValue(true),
    } as unknown as TenantsPersistenceService;
    const service = new TenantsService(persistence);

    await expect(
      service.deleteTenant({ id: 'tenant-1' }),
    ).resolves.toBeUndefined();
  });
});
