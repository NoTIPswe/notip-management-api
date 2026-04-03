import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersPersistenceService } from './users.persistence.service';
import { UsersRole } from '../enums/users.enum';
import { KeycloakAdminService } from '../../admin/tenants/services/keycloak-admin.service';
import { UserEntity } from '../entities/user.entity';

const createUserEntity = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'kc-user-1',
    tenantId: 'tenant-1',
    email: 'user@example.com',
    username: 'User One',
    role: UsersRole.TENANT_ADMIN,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  }) as unknown as UserEntity;

describe('UsersService', () => {
  let service: UsersService;
  let persistence: jest.Mocked<UsersPersistenceService>;
  let keycloak: jest.Mocked<KeycloakAdminService>;

  let getUsersMock: jest.Mock;
  let createUserPersistenceMock: jest.Mock;
  let updateUserPersistenceMock: jest.Mock;
  let getUsersByIdsMock: jest.Mock;
  let getTenantAdminsMock: jest.Mock;
  let deleteUsersByIdsMock: jest.Mock;

  let createTenantUserMock: jest.Mock;
  let syncUserApplicationRoleMock: jest.Mock;
  let updateUserKeycloakMock: jest.Mock;
  let deleteUserMock: jest.Mock;

  beforeEach(() => {
    getUsersMock = jest.fn();
    createUserPersistenceMock = jest.fn();
    updateUserPersistenceMock = jest.fn();
    getUsersByIdsMock = jest.fn();
    getTenantAdminsMock = jest.fn();
    deleteUsersByIdsMock = jest.fn();

    persistence = {
      getUsers: getUsersMock,
      createUser: createUserPersistenceMock,
      updateUser: updateUserPersistenceMock,
      getUsersByIds: getUsersByIdsMock,
      getTenantAdmins: getTenantAdminsMock,
      deleteUsersByIds: deleteUsersByIdsMock,
    } as unknown as jest.Mocked<UsersPersistenceService>;

    createTenantUserMock = jest.fn();
    syncUserApplicationRoleMock = jest.fn();
    updateUserKeycloakMock = jest.fn();
    deleteUserMock = jest.fn();

    keycloak = {
      createTenantUser: createTenantUserMock,
      syncUserApplicationRole: syncUserApplicationRoleMock,
      updateUser: updateUserKeycloakMock,
      deleteUser: deleteUserMock,
    } as unknown as jest.Mocked<KeycloakAdminService>;

    service = new UsersService(persistence, keycloak);
  });

  it('returns mapped users', async () => {
    getUsersMock.mockResolvedValue([createUserEntity()]);

    await expect(service.getUsers({ tenantId: 'tenant-1' })).resolves.toEqual([
      expect.objectContaining({
        id: 'kc-user-1',
        email: 'user@example.com',
      }),
    ]);
  });

  it('throws when no users are found', async () => {
    getUsersMock.mockResolvedValue([]);

    await expect(service.getUsers({ tenantId: 'tenant-1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates a user and syncs with Keycloak', async () => {
    createTenantUserMock.mockResolvedValue('kc-user-1');
    createUserPersistenceMock.mockResolvedValue(createUserEntity());

    await expect(
      service.createUser({
        tenantId: 'tenant-1',
        email: 'user@example.com',
        username: 'User One',
        role: UsersRole.TENANT_ADMIN,
        password: 'password',
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'kc-user-1' }));

    expect(createTenantUserMock).toHaveBeenCalled();
    expect(createUserPersistenceMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'kc-user-1' }),
    );
  });

  it('updates a user and syncs with Keycloak', async () => {
    updateUserPersistenceMock.mockResolvedValue(createUserEntity());

    await expect(
      service.updateUser({
        id: 'kc-user-1',
        tenantId: 'tenant-1',
        email: 'new@example.com',
        username: 'new-username',
        role: UsersRole.TENANT_USER,
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'kc-user-1' }));

    expect(syncUserApplicationRoleMock).toHaveBeenCalledWith(
      'kc-user-1',
      UsersRole.TENANT_USER,
    );
    expect(updateUserKeycloakMock).toHaveBeenCalledWith('kc-user-1', {
      email: 'new@example.com',
      username: 'new-username',
    });
  });

  it('throws NotFoundException when updating missing user', async () => {
    updateUserPersistenceMock.mockResolvedValue(null);

    await expect(
      service.updateUser({ id: 'missing', tenantId: 't1', email: 'e' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes users from Keycloak and DB', async () => {
    getUsersByIdsMock.mockResolvedValue([
      createUserEntity({ role: UsersRole.TENANT_USER }),
    ]);
    deleteUsersByIdsMock.mockResolvedValue(1);

    await expect(
      service.deleteUsers({
        ids: ['kc-user-1'],
        requesterId: 'other',
        requesterRole: UsersRole.TENANT_ADMIN,
      }),
    ).resolves.toBe(1);

    expect(deleteUserMock).toHaveBeenCalledWith('kc-user-1');
    expect(deleteUsersByIdsMock).toHaveBeenCalled();
  });

  it('prevents TENANT_ADMIN deletion by non-SYSTEM_ADMIN', async () => {
    getUsersByIdsMock.mockResolvedValue([
      createUserEntity({ role: UsersRole.TENANT_ADMIN }),
    ]);

    await expect(
      service.deleteUsers({
        ids: ['kc-user-1'],
        requesterId: 'other',
        requesterRole: UsersRole.TENANT_ADMIN,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows TENANT_ADMIN deletion by SYSTEM_ADMIN and cascades in Keycloak', async () => {
    getUsersByIdsMock.mockResolvedValue([
      createUserEntity({ role: UsersRole.TENANT_ADMIN, tenantId: 't1' }),
    ]);
    getTenantAdminsMock.mockResolvedValue([
      createUserEntity({
        id: 'kc-user-1',
        role: UsersRole.TENANT_ADMIN,
        tenantId: 't1',
      }),
    ]);
    getUsersMock.mockResolvedValue([
      { id: 'u1', tenantId: 't1' } as any,
      { id: 'kc-user-1', tenantId: 't1', role: UsersRole.TENANT_ADMIN } as any,
    ]);
    deleteUsersByIdsMock.mockResolvedValue(1);

    await expect(
      service.deleteUsers({
        ids: ['kc-user-1'],
        requesterId: 'other',
        requesterRole: UsersRole.SYSTEM_ADMIN,
      }),
    ).resolves.toBe(1);

    expect(deleteUserMock).toHaveBeenCalledWith('u1');
    expect(deleteUserMock).toHaveBeenCalledWith('kc-user-1');
  });

  it('prevents self-deletion', async () => {
    getUsersByIdsMock.mockResolvedValue([createUserEntity({ id: 'self' })]);

    await expect(
      service.deleteUsers({
        ids: ['self'],
        requesterId: 'self',
        requesterRole: UsersRole.SYSTEM_ADMIN,
      }),
    ).resolves.toBe(0);
    expect(deleteUserMock).not.toHaveBeenCalled();
    expect(deleteUsersByIdsMock).not.toHaveBeenCalled();
  });

  it('rolls back Keycloak user creation if DB save fails', async () => {
    createTenantUserMock.mockResolvedValue('kc-user-1');
    createUserPersistenceMock.mockRejectedValue(new Error('DB failure'));
    deleteUserMock.mockResolvedValue(undefined);

    await expect(
      service.createUser({
        tenantId: 't1',
        email: 'e',
        username: 'n',
        role: UsersRole.TENANT_USER,
        password: 'p',
      }),
    ).rejects.toThrow('DB failure');

    expect(deleteUserMock).toHaveBeenCalledWith('kc-user-1');
  });

  it('throws InternalServerErrorException if Keycloak rollback fails', async () => {
    createTenantUserMock.mockResolvedValue('kc-user-1');
    createUserPersistenceMock.mockRejectedValue(new Error('DB failure'));
    deleteUserMock.mockRejectedValue(new Error('Rollback failure'));

    await expect(
      service.createUser({
        tenantId: 't1',
        email: 'e',
        username: 'n',
        role: UsersRole.TENANT_USER,
        password: 'p',
      }),
    ).rejects.toThrow('Failed to rollback Keycloak user after DB error');
  });

  it('performs partial Keycloak update in updateUser', async () => {
    updateUserPersistenceMock.mockResolvedValue(createUserEntity());

    // Only role update
    await service.updateUser({
      id: 'kc-user-1',
      tenantId: 'tenant-1',
      role: UsersRole.TENANT_USER,
    });
    expect(syncUserApplicationRoleMock).toHaveBeenCalledWith(
      'kc-user-1',
      UsersRole.TENANT_USER,
    );
    expect(updateUserKeycloakMock).not.toHaveBeenCalled();

    jest.clearAllMocks();
    updateUserPersistenceMock.mockResolvedValue(createUserEntity());

    // Only email update
    await service.updateUser({
      id: 'kc-user-1',
      tenantId: 'tenant-1',
      email: 'new@e.com',
    });
    expect(syncUserApplicationRoleMock).not.toHaveBeenCalled();
    expect(updateUserKeycloakMock).toHaveBeenCalledWith('kc-user-1', {
      email: 'new@e.com',
      username: undefined,
    });
  });

  it('skips Keycloak delete if user has no ID during deleteUsers', async () => {
    getUsersByIdsMock.mockResolvedValue([{ email: 'e' } as any]);
    deleteUsersByIdsMock.mockResolvedValue(1);

    await service.deleteUsers({
      ids: ['id'],
      requesterId: 'other',
      requesterRole: UsersRole.SYSTEM_ADMIN,
    });
    expect(deleteUserMock).not.toHaveBeenCalled();
  });
});
