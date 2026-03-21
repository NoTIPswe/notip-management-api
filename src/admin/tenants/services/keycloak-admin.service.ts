import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersRole } from '../../../users/enums/users.enum';

interface CreateTenantAdminUserInput {
  email: string;
  name: string;
  password: string;
  tenantId: string;
}

interface CreateTenantUserInput {
  email: string;
  name: string;
  password: string;
  tenantId: string;
  role: UsersRole;
}

interface AccessTokenResponse {
  access_token?: string;
}

interface KeycloakClientRepresentation {
  id?: string;
}

interface KeycloakRoleRepresentation {
  id?: string;
  name?: string;
}

const APPLICATION_ROLES = new Set<UsersRole>(Object.values(UsersRole));

@Injectable()
export class KeycloakAdminService {
  constructor(private readonly configService: ConfigService) {}

  async createTenantAdminUser(
    input: CreateTenantAdminUserInput,
  ): Promise<string> {
    return this.createTenantUser({
      email: input.email,
      name: input.name,
      password: input.password,
      tenantId: input.tenantId,
      role: UsersRole.TENANT_ADMIN,
    });
  }

  async createTenantUser(input: CreateTenantUserInput): Promise<string> {
    const accessToken = await this.getAdminAccessToken();
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');
    const { firstName, lastName } = this.splitName(input.name);

    const response = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: input.email,
          email: input.email,
          enabled: true,
          firstName,
          lastName,
          emailVerified: true,
          requiredActions: [],
          attributes: {
            role: [input.role],
            tenant_id: [input.tenantId],
          },
          credentials: [
            {
              type: 'password',
              value: input.password,
              temporary: false,
            },
          ],
        }),
      },
    );

    if (response.status === 409) {
      throw new ConflictException('User already exists in Keycloak');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new InternalServerErrorException(
        `Keycloak user creation failed (${response.status}): ${body}`,
      );
    }

    const locationHeader = response.headers.get('location');
    if (!locationHeader) {
      throw new InternalServerErrorException(
        'Keycloak user created without location header',
      );
    }

    const userId = locationHeader.split('/').pop() ?? '';
    if (!userId) {
      throw new InternalServerErrorException(
        'Keycloak user created with invalid location header',
      );
    }

    try {
      await this.ensureExclusiveAppRole(accessToken, userId, input.role);
    } catch (error) {
      try {
        await this.deleteUserWithToken(userId, accessToken);
      } catch {
        throw new InternalServerErrorException(
          'Keycloak role assignment failed and cleanup was not possible',
        );
      }

      throw error;
    }

    return userId;
  }

  async deleteUser(userId: string): Promise<void> {
    if (!userId) {
      return;
    }

    const accessToken = await this.getAdminAccessToken();
    await this.deleteUserWithToken(userId, accessToken);
  }

  async syncUserApplicationRole(
    userId: string,
    targetRole: UsersRole,
  ): Promise<void> {
    if (!userId) {
      return;
    }

    const accessToken = await this.getAdminAccessToken();
    await this.ensureExclusiveAppRole(accessToken, userId, targetRole);
  }

  private async deleteUserWithToken(
    userId: string,
    accessToken: string,
  ): Promise<void> {
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');

    const response = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (response.status === 404) {
      return;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new InternalServerErrorException(
        `Keycloak user delete failed (${response.status}): ${body}`,
      );
    }
  }

  private async ensureExclusiveAppRole(
    accessToken: string,
    userId: string,
    targetRole: UsersRole,
  ): Promise<void> {
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');
    const managementClientId = this.getRequiredEnv('KEYCLOAK_MGMT_CLIENT_ID');

    const clientsResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients?clientId=${encodeURIComponent(managementClientId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!clientsResponse.ok) {
      const body = await clientsResponse.text();
      throw new InternalServerErrorException(
        `Keycloak client lookup failed (${clientsResponse.status}): ${body}`,
      );
    }

    const clients =
      (await clientsResponse.json()) as KeycloakClientRepresentation[];
    const clientUuid = clients[0]?.id;

    if (!clientUuid) {
      throw new InternalServerErrorException(
        `Keycloak client not found: ${managementClientId}`,
      );
    }

    const userRolesResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}/role-mappings/clients/${clientUuid}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!userRolesResponse.ok) {
      const body = await userRolesResponse.text();
      throw new InternalServerErrorException(
        `Keycloak user role lookup failed (${userRolesResponse.status}): ${body}`,
      );
    }

    const assignedRoles =
      (await userRolesResponse.json()) as KeycloakRoleRepresentation[];

    const appRoles = assignedRoles.filter((role) =>
      APPLICATION_ROLES.has(role.name as UsersRole),
    );

    const rolesToRemove = appRoles.filter((role) => role.name !== targetRole);
    if (rolesToRemove.length > 0) {
      const removeResponse = await fetch(
        `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}/role-mappings/clients/${clientUuid}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rolesToRemove),
        },
      );

      if (!removeResponse.ok) {
        const body = await removeResponse.text();
        throw new InternalServerErrorException(
          `Keycloak role cleanup failed (${removeResponse.status}): ${body}`,
        );
      }
    }

    const hasTargetRole = appRoles.some((role) => role.name === targetRole);
    if (hasTargetRole) {
      return;
    }

    const roleResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${clientUuid}/roles/${targetRole}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!roleResponse.ok) {
      const body = await roleResponse.text();
      throw new InternalServerErrorException(
        `Keycloak role lookup failed (${roleResponse.status}): ${body}`,
      );
    }

    const role = (await roleResponse.json()) as KeycloakRoleRepresentation;
    if (!role.id || !role.name) {
      throw new InternalServerErrorException(
        'Keycloak role payload is invalid',
      );
    }

    const assignResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}/role-mappings/clients/${clientUuid}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([role]),
      },
    );

    if (!assignResponse.ok) {
      const body = await assignResponse.text();
      throw new InternalServerErrorException(
        `Keycloak role assignment failed (${assignResponse.status}): ${body}`,
      );
    }
  }

  private async getAdminAccessToken(): Promise<string> {
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const adminRealm = this.configService.get<string>(
      'KEYCLOAK_ADMIN_REALM',
      'master',
    );
    const clientId = this.configService.get<string>(
      'KEYCLOAK_ADMIN_CLIENT_ID',
      'admin-cli',
    );
    const username = this.getRequiredEnv('KEYCLOAK_ADMIN_USER');
    const password = this.getRequiredEnv('KEYCLOAK_ADMIN_PASSWORD');

    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      username,
      password,
    });

    const response = await fetch(
      `${keycloakBaseUrl}/realms/${adminRealm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(
        `Keycloak admin token request failed (${response.status}): ${text}`,
      );
    }

    const tokenPayload = (await response.json()) as AccessTokenResponse;
    if (!tokenPayload.access_token) {
      throw new InternalServerErrorException(
        'Keycloak admin token response missing access_token',
      );
    }

    return tokenPayload.access_token;
  }

  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(`Missing env var ${key}`);
    }
    return value;
  }

  private splitName(name: string): { firstName: string; lastName: string } {
    const normalized = name.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      return { firstName: 'Tenant', lastName: 'Admin' };
    }

    const [firstName, ...rest] = normalized.split(' ');
    const lastName = rest.join(' ').trim() || 'Admin';
    return { firstName, lastName };
  }
}
