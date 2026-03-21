import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersPersistenceService } from './users.persistence.service';
import { UsersRole } from '../enums/users.enum';
import { KeycloakAdminService } from '../../admin/tenants/services/keycloak-admin.service';

const createUserEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  tenantId: 'tenant-1',
  keycloakId: 'kc-user-1',
  email: 'user@example.com',
  name: 'User One',
  role: UsersRole.TENANT_ADMIN,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('UsersService', () => {
  it('returns mapped users', async () => {
    const persistence = {
      getUsers: jest.fn().mockResolvedValue([createUserEntity()]),
    } as unknown as UsersPersistenceService;
    const keycloakAdminService = {
      syncUserApplicationRole: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new UsersService(persistence, keycloakAdminService);

    await expect(service.getUsers({ tenantId: 'tenant-1' })).resolves.toEqual([
      expect.objectContaining({
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'user@example.com',
      }),
    ]);
  });

  it('throws when no users are found', async () => {
    const persistence = {
      getUsers: jest.fn().mockResolvedValue([]),
    } as unknown as UsersPersistenceService;
    const keycloakAdminService = {
      syncUserApplicationRole: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new UsersService(persistence, keycloakAdminService);

    await expect(service.getUsers({ tenantId: 'tenant-1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('passes create input to persistence', async () => {
    const createUserMock = jest.fn().mockResolvedValue(createUserEntity());
    const persistence = {
      createUser: createUserMock,
    } as unknown as UsersPersistenceService;
    const createTenantUserMock = jest.fn().mockResolvedValue('kc-user-1');
    const syncUserApplicationRoleMock = jest.fn().mockResolvedValue(undefined);
    const keycloakAdminService = {
      createTenantUser: createTenantUserMock,
      syncUserApplicationRole: syncUserApplicationRoleMock,
      deleteUser: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new UsersService(persistence, keycloakAdminService);

    await expect(
      service.createUser({
        tenantId: 'tenant-1',
        email: 'user@example.com',
        name: 'User One',
        role: UsersRole.TENANT_ADMIN,
        password: 'secret',
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'user-1' }));
    expect(createUserMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      keycloakId: 'kc-user-1',
      email: 'user@example.com',
      name: 'User One',
      role: UsersRole.TENANT_ADMIN,
    });
    expect(createTenantUserMock).toHaveBeenCalled();
    expect(syncUserApplicationRoleMock).not.toHaveBeenCalled();
  });

  it('updates an existing user', async () => {
    const updateUserMock = jest.fn().mockResolvedValue(createUserEntity());
    const persistence = {
      updateUser: updateUserMock,
    } as unknown as UsersPersistenceService;
    const syncUserApplicationRoleMock = jest.fn().mockResolvedValue(undefined);
    const keycloakAdminService = {
      createTenantUser: jest.fn(),
      syncUserApplicationRole: syncUserApplicationRoleMock,
      deleteUser: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new UsersService(persistence, keycloakAdminService);

    await expect(
      service.updateUser({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Updated User',
        role: UsersRole.TENANT_USER,
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'user-1' }));

    expect(updateUserMock).toHaveBeenCalled();
    expect(syncUserApplicationRoleMock).toHaveBeenCalledWith(
      'kc-user-1',
      UsersRole.TENANT_USER,
    );
  });

  it('throws when updating a missing user', async () => {
    const persistence = {
      updateUser: jest.fn().mockResolvedValue(null),
    } as unknown as UsersPersistenceService;
    const keycloakAdminService = {
      createTenantUser: jest.fn(),
      syncUserApplicationRole: jest.fn(),
      deleteUser: jest.fn(),
    } as unknown as KeycloakAdminService;
    const service = new UsersService(persistence, keycloakAdminService);

    await expect(
      service.updateUser({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Updated User',
        role: UsersRole.TENANT_USER,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('delegates bulk deletion', async () => {
    const persistence = {
      getUsersByIds: jest.fn().mockResolvedValue([createUserEntity()]),
      deleteUsersByIds: jest.fn().mockResolvedValue(2),
    } as unknown as UsersPersistenceService;
    const deleteUserMock = jest.fn().mockResolvedValue(undefined);
    const keycloakAdminService = {
      createTenantUser: jest.fn(),
      syncUserApplicationRole: jest.fn(),
      deleteUser: deleteUserMock,
    } as unknown as KeycloakAdminService;
    const service = new UsersService(persistence, keycloakAdminService);

    await expect(service.deleteUsers({ ids: ['1', '2'] })).resolves.toBe(2);
    expect(deleteUserMock).toHaveBeenCalledWith('kc-user-1');
  });
});
