import { NotFoundException } from '@nestjs/common';
import { TenantStatus } from '../../../common/enums/tenants.enum';
import { TenantsService } from './tenants.service';
import { TenantsPersistenceService } from './tenants.persistence.service';
import { KeycloakAdminService } from './keycloak-admin.service';
import { DataSource, EntityManager } from 'typeorm';
import { TenantEntity } from '../../../common/entities/tenant.entity';
import { UserEntity } from '../../../users/entities/user.entity';
import { ApiClientService } from '../../../api-client/services/api-client.service';

const createTenantEntity = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'tenant-1',
    name: 'Tenant One',
    status: TenantStatus.ACTIVE,
    suspensionIntervalDays: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    ...overrides,
  }) as unknown as TenantEntity;

describe('TenantsService', () => {
  let service: TenantsService;
  let persistence: jest.Mocked<TenantsPersistenceService>;
  let keycloak: jest.Mocked<KeycloakAdminService>;
  let dataSource: jest.Mocked<DataSource>;
  let apiClientService: jest.Mocked<ApiClientService>;

  let getTenantsMock: jest.Mock;
  let createTenantMock: jest.Mock;
  let updateTenantMock: jest.Mock;
  let deleteTenantMock: jest.Mock;
  let getTenantAdminUsersMock: jest.Mock;
  let getUsersByTenantMock: jest.Mock;
  let createTenantAdminLocalUserMock: jest.Mock;

  let createTenantAdminUserMock: jest.Mock;
  let deleteUserMock: jest.Mock;
  let updateTenantGroupMock: jest.Mock;
  let deleteTenantGroupMock: jest.Mock;

  let transactionMock: jest.Mock;

  beforeEach(() => {
    getTenantsMock = jest.fn();
    createTenantMock = jest.fn();
    updateTenantMock = jest.fn();
    deleteTenantMock = jest.fn();
    getTenantAdminUsersMock = jest.fn();
    getUsersByTenantMock = jest.fn();
    createTenantAdminLocalUserMock = jest.fn();

    persistence = {
      getTenants: getTenantsMock,
      createTenant: createTenantMock,
      updateTenant: updateTenantMock,
      deleteTenant: deleteTenantMock,
      getTenantAdminUsers: getTenantAdminUsersMock,
      getUsersByTenant: getUsersByTenantMock,
      createTenantAdminLocalUser: createTenantAdminLocalUserMock,
    } as unknown as jest.Mocked<TenantsPersistenceService>;

    createTenantAdminUserMock = jest.fn();
    deleteUserMock = jest.fn();
    updateTenantGroupMock = jest.fn();
    deleteTenantGroupMock = jest.fn();

    keycloak = {
      createTenantAdminUser: createTenantAdminUserMock,
      deleteUser: deleteUserMock,
      updateTenantGroup: updateTenantGroupMock,
      deleteTenantGroup: deleteTenantGroupMock,
    } as unknown as jest.Mocked<KeycloakAdminService>;

    transactionMock = jest.fn();
    dataSource = {
      transaction: transactionMock,
    } as unknown as jest.Mocked<DataSource>;

    apiClientService = {
      deleteApiClientsForTenant: jest.fn(),
    } as unknown as jest.Mocked<ApiClientService>;

    service = new TenantsService(
      dataSource,
      persistence,
      keycloak,
      apiClientService,
    );
  });

  it('returns mapped tenants', async () => {
    getTenantsMock.mockResolvedValue([createTenantEntity()]);

    await expect(service.getTenants()).resolves.toEqual([
      expect.objectContaining({
        id: 'tenant-1',
        name: 'Tenant One',
      }),
    ]);
  });

  it('returns tenant users mapped to API shape', async () => {
    getUsersByTenantMock.mockResolvedValue([
      { id: 'user-1', role: 'tenant_admin' } as unknown as UserEntity,
    ]);

    await expect(service.getTenantUsers('tenant-1')).resolves.toEqual([
      { user_id: 'user-1', role: 'tenant_admin' },
    ]);
  });

  it('creates a tenant', async () => {
    transactionMock.mockImplementation(
      (cb: (m: EntityManager) => Promise<any>) =>
        cb('manager' as unknown as EntityManager),
    );
    createTenantMock.mockResolvedValue(createTenantEntity());
    createTenantAdminUserMock.mockResolvedValue('kc-user-1');

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

    expect(createTenantAdminUserMock).toHaveBeenCalled();
    expect(createTenantAdminLocalUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'kc-user-1' }),
      'manager',
    );
  });

  it('updates a tenant and syncs with Keycloak', async () => {
    getTenantsMock.mockResolvedValue([createTenantEntity()]);
    updateTenantMock.mockResolvedValue(createTenantEntity());

    await expect(
      service.updateTenant({
        id: 'tenant-1',
        name: 'Updated Name',
      }),
    ).resolves.toBeDefined();

    expect(updateTenantGroupMock).toHaveBeenCalledWith('tenant-1', 'tenant-1');
  });

  it('throws NotFoundException when updating missing tenant', async () => {
    getTenantsMock.mockResolvedValue([]);

    await expect(
      service.updateTenant({ id: 'missing', name: 'name' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes a tenant and removes Keycloak group', async () => {
    transactionMock.mockImplementation(
      (cb: (m: EntityManager) => Promise<any>) =>
        cb('manager' as unknown as EntityManager),
    );
    getUsersByTenantMock.mockResolvedValue([
      { id: 'u1' } as unknown as UserEntity,
    ]);
    deleteTenantMock.mockResolvedValue(true);

    await expect(
      service.deleteTenant({ id: 'tenant-1' }),
    ).resolves.toBeUndefined();

    expect(deleteUserMock).toHaveBeenCalledWith('u1');
    expect(deleteTenantGroupMock).toHaveBeenCalledWith('tenant-1');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(apiClientService.deleteApiClientsForTenant).toHaveBeenCalledWith(
      'tenant-1',
    );

    expect(deleteTenantMock).toHaveBeenCalledWith(
      { id: 'tenant-1' },
      'manager',
    );
  });
});
