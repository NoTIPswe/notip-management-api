import { ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { UsersRole } from '../users/enums/users.enum';
import { MockAuthGuard } from './mock-auth.guard';

describe('MockAuthGuard', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('injects a default system admin mock user', () => {
    process.env = { ...originalEnv };
    const request: Record<string, unknown> = {};
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    const guard = new MockAuthGuard();

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual(
      expect.objectContaining({
        actorRole: UsersRole.SYSTEM_ADMIN,
        effectiveRole: UsersRole.SYSTEM_ADMIN,
        actorTenantId: 'tenant-1',
      }),
    );
  });

  it('injects the configured mock tenant and role', () => {
    process.env = {
      ...originalEnv,
      MOCK_ROLE: UsersRole.TENANT_ADMIN,
      MOCK_TENANT_ID: 'tenant-99',
    };
    const request: Record<string, unknown> = {};
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    const guard = new MockAuthGuard();

    guard.canActivate(context);

    expect(request.user).toEqual(
      expect.objectContaining({
        actorRole: UsersRole.TENANT_ADMIN,
        effectiveRole: UsersRole.TENANT_ADMIN,
        actorTenantId: 'tenant-99',
        effectiveTenantId: 'tenant-99',
      }),
    );
  });

  it('falls back to system admin for unknown mock roles', () => {
    process.env = {
      ...originalEnv,
      MOCK_ROLE: 'not-a-role',
    };
    const request: Record<string, unknown> = {};
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    new MockAuthGuard().canActivate(context);

    expect((request.user as AuthenticatedUser).effectiveRole).toBe(
      UsersRole.SYSTEM_ADMIN,
    );
  });
});
