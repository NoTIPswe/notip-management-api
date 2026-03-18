import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessPolicyGuard } from './access-policy.guard';
import {
  ACCESS_POLICY_KEY,
  AccessPolicy,
} from 'src/common/decorators/access-policy.decorator';
import { UsersRole } from 'src/users/enums/users.enum';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

describe('AccessPolicyGuard', () => {
  let reflector: Reflector;
  let guard: AccessPolicyGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AccessPolicyGuard(reflector);
  });

  function createContext(
    policy: AccessPolicy | undefined,
    user?: AuthenticatedUser,
  ): ExecutionContext {
    const handler = () => undefined;
    const controllerClass = class TestController {};

    if (policy) {
      Reflect.defineMetadata(ACCESS_POLICY_KEY, policy, handler);
    }

    const request = { user };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => handler,
      getClass: () => controllerClass,
    } as ExecutionContext;
  }

  it('allows public routes without user context', () => {
    const context = createContext(AccessPolicy.PUBLIC);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('uses effectiveRole, not actorRole, for admin access', () => {
    const context = createContext(AccessPolicy.ADMIN, {
      actorUserId: 'sys-admin-id',
      actorRole: UsersRole.SYSTEM_ADMIN,
      effectiveUserId: 'tenant-admin-id',
      effectiveRole: UsersRole.TENANT_ADMIN,
      effectiveTenantId: 'tenant-1',
      isImpersonating: true,
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows tenant access when impersonation has an effective tenant context', () => {
    const context = createContext(AccessPolicy.TENANT, {
      actorUserId: 'sys-admin-id',
      actorRole: UsersRole.SYSTEM_ADMIN,
      effectiveUserId: 'tenant-admin-id',
      effectiveRole: UsersRole.TENANT_ADMIN,
      effectiveTenantId: 'tenant-1',
      isImpersonating: true,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows admin access when the effective role is system_admin even if actor is tenant_admin', () => {
    const context = createContext(AccessPolicy.ADMIN, {
      actorUserId: 'tenant-admin-id',
      actorRole: UsersRole.TENANT_ADMIN,
      actorTenantId: 'tenant-1',
      effectiveUserId: 'sys-admin-id',
      effectiveRole: UsersRole.SYSTEM_ADMIN,
      isImpersonating: true,
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
