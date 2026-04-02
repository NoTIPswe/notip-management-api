import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessPolicyGuard } from './access-policy.guard';
import { AccessPolicy } from '../common/decorators/access-policy.decorator';
import { UsersRole } from '../users/enums/users.enum';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { DataSource } from 'typeorm';
import { TenantStatus } from '../common/enums/tenants.enum';

const createContext = (user?: AuthenticatedUser): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('AccessPolicyGuard', () => {
  it('allows requests when no policy is set', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new AccessPolicyGuard(reflector);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('allows public routes', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.PUBLIC),
    } as unknown as Reflector;
    const guard = new AccessPolicyGuard(reflector);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('rejects protected routes without a user', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.TENANT),
    } as unknown as Reflector;
    const guard = new AccessPolicyGuard(reflector);

    await expect(guard.canActivate(createContext())).resolves.toBe(false);
  });

  it('allows admin routes for system admins only', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.ADMIN),
    } as unknown as Reflector;
    const guard = new AccessPolicyGuard(reflector);
    const admin = {
      actorUserId: '1',
      actorRole: UsersRole.SYSTEM_ADMIN,
      effectiveUserId: '1',
      effectiveRole: UsersRole.SYSTEM_ADMIN,
      isImpersonating: false,
    } as AuthenticatedUser;
    const tenantUser = {
      actorUserId: '2',
      actorRole: UsersRole.TENANT_ADMIN,
      effectiveUserId: '2',
      effectiveRole: UsersRole.TENANT_ADMIN,
      effectiveTenantId: 'tenant-1',
      isImpersonating: false,
    } as AuthenticatedUser;

    await expect(guard.canActivate(createContext(admin))).resolves.toBe(true);
    await expect(guard.canActivate(createContext(tenantUser))).resolves.toBe(
      false,
    );
  });

  it('requires a tenant for tenant-scoped routes', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.TENANT),
    } as unknown as Reflector;
    const guard = new AccessPolicyGuard(reflector);
    const user = {
      actorUserId: '1',
      actorRole: UsersRole.TENANT_USER,
      effectiveUserId: '1',
      effectiveRole: UsersRole.TENANT_USER,
      effectiveTenantId: 'tenant-1',
      isImpersonating: false,
    } as AuthenticatedUser;

    await expect(guard.canActivate(createContext(user))).resolves.toBe(true);
    await expect(
      guard.canActivate(
        createContext({
          ...user,
          effectiveTenantId: undefined,
        }),
      ),
    ).resolves.toBe(false);
  });

  it('rejects tenant-scoped routes when tenant is suspended', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.TENANT),
    } as unknown as Reflector;
    const findOneBy = jest
      .fn()
      .mockResolvedValue({ id: 'tenant-1', status: TenantStatus.SUSPENDED });
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn().mockReturnValue({ findOneBy }),
    } as unknown as DataSource;

    const guard = new AccessPolicyGuard(reflector, dataSource);
    const user = {
      actorUserId: '1',
      actorRole: UsersRole.TENANT_USER,
      effectiveUserId: '1',
      effectiveRole: UsersRole.TENANT_USER,
      effectiveTenantId: 'tenant-1',
      isImpersonating: false,
    } as AuthenticatedUser;

    await expect(guard.canActivate(createContext(user))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects tenant-scoped routes when tenant does not exist', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.TENANT),
    } as unknown as Reflector;
    const findOneBy = jest.fn().mockResolvedValue(null);
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn().mockReturnValue({ findOneBy }),
    } as unknown as DataSource;

    const guard = new AccessPolicyGuard(reflector, dataSource);
    const user = {
      actorUserId: '1',
      actorRole: UsersRole.TENANT_USER,
      effectiveUserId: '1',
      effectiveRole: UsersRole.TENANT_USER,
      effectiveTenantId: 'tenant-404',
      isImpersonating: false,
    } as AuthenticatedUser;

    await expect(guard.canActivate(createContext(user))).resolves.toBe(false);
  });

  it('reactivates expired tenant suspension and allows access', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.TENANT),
    } as unknown as Reflector;
    const findOneBy = jest.fn().mockResolvedValue({
      id: 'tenant-1',
      status: TenantStatus.SUSPENDED,
      suspensionUntil: new Date(Date.now() - 60_000),
      suspensionIntervalDays: 3,
    });
    const save = jest.fn().mockResolvedValue({
      id: 'tenant-1',
      status: TenantStatus.ACTIVE,
      suspensionUntil: null,
      suspensionIntervalDays: null,
    });
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn().mockReturnValue({ findOneBy, save }),
    } as unknown as DataSource;

    const guard = new AccessPolicyGuard(reflector, dataSource);
    const user = {
      actorUserId: '1',
      actorRole: UsersRole.TENANT_USER,
      effectiveUserId: '1',
      effectiveRole: UsersRole.TENANT_USER,
      effectiveTenantId: 'tenant-1',
      isImpersonating: false,
    } as AuthenticatedUser;

    await expect(guard.canActivate(createContext(user))).resolves.toBe(true);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TenantStatus.ACTIVE,
        suspensionUntil: null,
        suspensionIntervalDays: null,
      }),
    );
  });
});
