import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantStatus } from '../../../common/enums/tenants.enum';
import { TenantsService } from './tenants.service';
import { TenantsPersistenceService } from './tenants.persistence.service';
import { KeycloakAdminService } from './keycloak-admin.service';
import { UsersRole } from '../../../users/enums/users.enum';

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
    const keycloakAdminService = {
      createTenantAdminUser: jest.fn(),
      deleteUser: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new TenantsService(persistence, keycloakAdminService);

    await expect(service.getTenants()).resolves.toEqual([
      expect.objectContaining({
        id: 'tenant-1',
        name: 'Tenant One',
        status: TenantStatus.ACTIVE,
      }),
    ]);
  });

  it('creates a tenant', async () => {
    const createTenantAdminLocalUserMock = jest.fn().mockResolvedValue({});
    const persistence = {
      createTenant: jest.fn().mockResolvedValue(createTenantEntity()),
      createTenantAdminLocalUser: createTenantAdminLocalUserMock,
      deleteTenant: jest.fn(),
    } as unknown as TenantsPersistenceService;
    const createTenantAdminUserMock = jest.fn().mockResolvedValue('kc-user-1');
    const keycloakAdminService = {
      createTenantAdminUser: createTenantAdminUserMock,
      deleteUser: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new TenantsService(persistence, keycloakAdminService);

    await expect(
      service.createTenant({
        name: 'Tenant One',
        adminEmail: 'admin@example.com',
        adminName: 'Admin User',
        adminPassword: 'Passw0rd!',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'tenant-1',
        name: 'Tenant One',
      }),
    );

    expect(createTenantAdminUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        name: 'Admin User',
        tenantId: 'tenant-1',
      }),
    );
    expect(createTenantAdminLocalUserMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      keycloakId: 'kc-user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: UsersRole.TENANT_ADMIN,
    });
  });

  it('maps unique violations during tenant creation', async () => {
    const persistence = {
      createTenant: jest.fn().mockRejectedValue({ code: '23505' }),
    } as unknown as TenantsPersistenceService;
    const keycloakAdminService = {
      createTenantAdminUser: jest.fn(),
      deleteUser: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new TenantsService(persistence, keycloakAdminService);

    await expect(
      service.createTenant({
        name: 'Tenant One',
        adminEmail: 'admin@example.com',
        adminName: 'Admin User',
        adminPassword: 'Passw0rd!',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates a tenant', async () => {
    const persistence = {
      updateTenant: jest.fn().mockResolvedValue(createTenantEntity()),
    } as unknown as TenantsPersistenceService;
    const keycloakAdminService = {
      createTenantAdminUser: jest.fn(),
      deleteUser: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new TenantsService(persistence, keycloakAdminService);

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
    const keycloakAdminService = {
      createTenantAdminUser: jest.fn(),
      deleteUser: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new TenantsService(persistence, keycloakAdminService);

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
    const keycloakAdminService = {
      createTenantAdminUser: jest.fn(),
      deleteUser: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new TenantsService(persistence, keycloakAdminService);

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
    const deleteUserMock = jest.fn();
    const persistence = {
      getTenantAdminUsers: jest.fn().mockResolvedValue([]),
      deleteTenant: jest.fn().mockResolvedValue(false),
    } as unknown as TenantsPersistenceService;
    const keycloakAdminService = {
      createTenantAdminUser: jest.fn(),
      deleteUser: deleteUserMock,
    } as unknown as KeycloakAdminService;
    const service = new TenantsService(persistence, keycloakAdminService);

    await expect(service.deleteTenant({ id: 'tenant-1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolves when deleting an existing tenant', async () => {
    const deleteUserMock = jest.fn().mockResolvedValue(undefined);
    const getTenantAdminUsersMock = jest
      .fn()
      .mockResolvedValue([{ id: 'user-1', keycloakId: 'kc-user-1' }]);
    const persistence = {
      getTenantAdminUsers: getTenantAdminUsersMock,
      deleteTenant: jest.fn().mockResolvedValue(true),
    } as unknown as TenantsPersistenceService;
    const keycloakAdminService = {
      createTenantAdminUser: jest.fn(),
      deleteUser: deleteUserMock,
    } as unknown as KeycloakAdminService;
    const service = new TenantsService(persistence, keycloakAdminService);

    await expect(
      service.deleteTenant({ id: 'tenant-1' }),
    ).resolves.toBeUndefined();

    expect(getTenantAdminUsersMock).toHaveBeenCalledWith('tenant-1');
    expect(deleteUserMock).toHaveBeenCalledWith('kc-user-1');
  });

  it('rolls back tenant when Keycloak provisioning fails', async () => {
    const deleteTenantMock = jest.fn().mockResolvedValue(true);
    const persistence = {
      createTenant: jest.fn().mockResolvedValue(createTenantEntity()),
      createTenantAdminLocalUser: jest.fn(),
      deleteTenant: deleteTenantMock,
    } as unknown as TenantsPersistenceService;
    const keycloakAdminService = {
      createTenantAdminUser: jest.fn().mockRejectedValue(new Error('boom')),
      deleteUser: jest.fn(),
    } as unknown as KeycloakAdminService;

    const service = new TenantsService(persistence, keycloakAdminService);

    await expect(
      service.createTenant({
        name: 'Tenant One',
        adminEmail: 'admin@example.com',
        adminName: 'Admin User',
        adminPassword: 'Passw0rd!',
      }),
    ).rejects.toThrow('boom');

    expect(deleteTenantMock).toHaveBeenCalledWith({ id: 'tenant-1' });
  });
});
