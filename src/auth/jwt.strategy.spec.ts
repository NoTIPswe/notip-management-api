jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn(),
}));

import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersRole } from '../users/enums/users.enum';

describe('JwtStrategy.validate', () => {
  const strategy = Object.create(JwtStrategy.prototype) as JwtStrategy;

  it('throws when the subject is missing', () => {
    expect(() =>
      strategy.validate({
        role: UsersRole.TENANT_ADMIN,
        tenant_id: 'tenant-1',
      }),
    ).toThrow(UnauthorizedException);
  });

  it('throws when the role is invalid', () => {
    expect(() =>
      strategy.validate({
        sub: 'user-1',
        role: 'invalid-role',
        tenant_id: 'tenant-1',
      }),
    ).toThrow('Missing role');
  });

  it('accepts normalized role values from token claim', () => {
    expect(
      strategy.validate({
        sub: 'user-1',
        role: 'TENANT-ADMIN',
        tenant_id: 'tenant-1',
      }).effectiveRole,
    ).toBe(UsersRole.TENANT_ADMIN);
  });

  it('extracts role from keycloak resource_access roles', () => {
    Object.assign(strategy as unknown as Record<string, unknown>, {
      managementClientId: 'notip-mgmt',
    });

    expect(
      strategy.validate({
        sub: 'user-1',
        tenant_id: 'tenant-1',
        resource_access: {
          'notip-mgmt': {
            roles: [UsersRole.TENANT_USER],
          },
        },
      }).effectiveRole,
    ).toBe(UsersRole.TENANT_USER);
  });

  it('throws when token contains multiple recognized roles', () => {
    Object.assign(strategy as unknown as Record<string, unknown>, {
      managementClientId: 'notip-mgmt',
    });

    expect(() =>
      strategy.validate({
        sub: 'user-1',
        tenant_id: 'tenant-1',
        resource_access: {
          'notip-mgmt': {
            roles: [UsersRole.TENANT_USER, UsersRole.TENANT_ADMIN],
          },
        },
      }),
    ).toThrow('Ambiguous role claims');
  });

  it('throws when a non-system admin has no tenant', () => {
    expect(() =>
      strategy.validate({
        sub: 'user-1',
        role: UsersRole.TENANT_ADMIN,
      }),
    ).toThrow('Missing tenant_id');
  });

  it('returns an authenticated user for a regular payload', () => {
    expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@example.com',
        name: 'Tenant User',
        role: UsersRole.TENANT_ADMIN,
        tenant_id: 'tenant-1',
      }),
    ).toEqual({
      actorUserId: 'user-1',
      actorEmail: 'user@example.com',
      actorName: 'Tenant User',
      actorRole: UsersRole.TENANT_ADMIN,
      actorTenantId: 'tenant-1',
      effectiveUserId: 'user-1',
      effectiveEmail: 'user@example.com',
      effectiveName: 'Tenant User',
      effectiveRole: UsersRole.TENANT_ADMIN,
      effectiveTenantId: 'tenant-1',
      isImpersonating: false,
    });
  });

  it('throws when impersonation claims are incomplete', () => {
    expect(() =>
      strategy.validate({
        sub: 'user-1',
        role: UsersRole.TENANT_USER,
        tenant_id: 'tenant-1',
        is_impersonating: true,
        actor_user_id: 'admin-1',
        actor_role: 'invalid-role',
      }),
    ).toThrow('Missing impersonation actor claims');
  });

  it('returns actor and effective claims for impersonation', () => {
    expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@example.com',
        name: 'Effective User',
        role: UsersRole.TENANT_USER,
        tenant_id: 'tenant-1',
        is_impersonating: true,
        actor_user_id: 'admin-1',
        actor_email: 'admin@example.com',
        actor_name: 'Admin User',
        actor_role: UsersRole.SYSTEM_ADMIN,
        actor_tenant_id: 'tenant-admin',
      }),
    ).toEqual({
      actorUserId: 'admin-1',
      actorEmail: 'admin@example.com',
      actorName: 'Admin User',
      actorRole: UsersRole.SYSTEM_ADMIN,
      actorTenantId: 'tenant-admin',
      effectiveUserId: 'user-1',
      effectiveEmail: 'user@example.com',
      effectiveName: 'Effective User',
      effectiveRole: UsersRole.TENANT_USER,
      effectiveTenantId: 'tenant-1',
      isImpersonating: true,
    });
  });
});
