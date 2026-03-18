import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessPolicyGuard } from './access-policy.guard';
import { AccessPolicy } from 'src/common/decorators/access-policy.decorator';
import { UsersRole } from 'src/users/enums/users.enum';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

const createContext = (user?: AuthenticatedUser): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('AccessPolicyGuard', () => {
  it('allows requests when no policy is set', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new AccessPolicyGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows public routes', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.PUBLIC),
    } as unknown as Reflector;
    const guard = new AccessPolicyGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('rejects protected routes without a user', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.TENANT),
    } as unknown as Reflector;
    const guard = new AccessPolicyGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(false);
  });

  it('allows admin routes for system admins only', () => {
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

    expect(guard.canActivate(createContext(admin))).toBe(true);
    expect(guard.canActivate(createContext(tenantUser))).toBe(false);
  });

  it('requires a tenant for tenant-scoped routes', () => {
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

    expect(guard.canActivate(createContext(user))).toBe(true);
    expect(
      guard.canActivate(
        createContext({
          ...user,
          effectiveTenantId: undefined,
        }),
      ),
    ).toBe(false);
  });
});
