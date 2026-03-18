import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersRole } from 'src/users/enums/users.enum';
import { JwtStrategy } from './jwt.strategy';

jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn(() => jest.fn()),
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          KEYCLOAK_URL: 'https://keycloak.example.com',
          KEYCLOAK_REALM: 'notip',
          KEYCLOAK_MGMT_CLIENT_ID: 'management-api',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    strategy = new JwtStrategy(configService);
  });

  it('maps a normal Keycloak token to actor=effective', async () => {
    await expect(
      strategy.validate({
        sub: 'tenant-admin-id',
        email: 'tenant-admin@example.com',
        name: 'Tenant Admin',
        role: UsersRole.TENANT_ADMIN,
        tenant_id: 'tenant-1',
      }),
    ).resolves.toEqual({
      actorUserId: 'tenant-admin-id',
      actorEmail: 'tenant-admin@example.com',
      actorName: 'Tenant Admin',
      actorRole: UsersRole.TENANT_ADMIN,
      actorTenantId: 'tenant-1',
      effectiveUserId: 'tenant-admin-id',
      effectiveEmail: 'tenant-admin@example.com',
      effectiveName: 'Tenant Admin',
      effectiveRole: UsersRole.TENANT_ADMIN,
      effectiveTenantId: 'tenant-1',
      isImpersonating: false,
    });
  });

  it('maps an impersonated Keycloak token to distinct actor/effective identities', async () => {
    await expect(
      strategy.validate({
        sub: 'tenant-admin-id',
        email: 'tenant-admin@example.com',
        name: 'Tenant Admin',
        role: UsersRole.TENANT_ADMIN,
        tenant_id: 'tenant-1',
        actor_user_id: 'sys-admin-id',
        actor_email: 'sys-admin@example.com',
        actor_name: 'System Admin',
        actor_role: UsersRole.SYSTEM_ADMIN,
        actor_tenant_id: null,
        is_impersonating: true,
      }),
    ).resolves.toEqual({
      actorUserId: 'sys-admin-id',
      actorEmail: 'sys-admin@example.com',
      actorName: 'System Admin',
      actorRole: UsersRole.SYSTEM_ADMIN,
      actorTenantId: null,
      effectiveUserId: 'tenant-admin-id',
      effectiveEmail: 'tenant-admin@example.com',
      effectiveName: 'Tenant Admin',
      effectiveRole: UsersRole.TENANT_ADMIN,
      effectiveTenantId: 'tenant-1',
      isImpersonating: true,
    });
  });

  it('rejects impersonated tokens without actor claims', async () => {
    await expect(
      strategy.validate({
        sub: 'tenant-admin-id',
        email: 'tenant-admin@example.com',
        name: 'Tenant Admin',
        role: UsersRole.TENANT_ADMIN,
        tenant_id: 'tenant-1',
        is_impersonating: true,
      }),
    ).rejects.toThrow(
      new UnauthorizedException('Missing impersonation actor claims'),
    );
  });
});
