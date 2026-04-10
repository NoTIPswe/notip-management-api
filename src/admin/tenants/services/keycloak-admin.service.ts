import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersRole } from '../../../users/enums/users.enum';

interface CreateTenantAdminUserInput {
  email: string;
  username: string;
  password: string;
  tenantId: string;
}

interface CreateTenantUserInput {
  email: string;
  username: string;
  password: string;
  tenantId: string;
  role: UsersRole;
}

interface AccessTokenResponse {
  access_token?: string;
}

interface KeycloakClientRepresentation {
  id?: string;
  clientId?: string;
  secret?: string;
  serviceAccountsEnabled?: boolean;
  authorizationServicesEnabled?: boolean;
  publicClient?: boolean;
  protocol?: string;
}

interface KeycloakRoleRepresentation {
  id?: string;
  name?: string;
}

interface KeycloakGroupRepresentation {
  id?: string;
  name?: string;
}

interface KeycloakUserRepresentation {
  id?: string;
  username?: string;
  attributes?: Record<string, string[]>;
}

const APPLICATION_ROLES = new Set<UsersRole>(Object.values(UsersRole));
const TENANT_ATTRIBUTE_KEY = 'tenant_id';

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);

  constructor(private readonly configService: ConfigService) {}

  async createApiClient(
    name: string,
    tenantId: string,
  ): Promise<{ clientId: string; clientSecret: string; keycloakUuid: string }> {
    this.logger.log(`Creating API client '${name}' for tenant ${tenantId}`);
    const accessToken = await this.getAdminAccessToken();
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');
    const clientId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const createClientRes = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          name,
          description: `API Client for tenant ${tenantId}`,
          enabled: true,
          serviceAccountsEnabled: true,
          publicClient: false,
          clientAuthenticatorType: 'client-secret',
          protocol: 'openid-connect',
          protocolMappers: [
            {
              name: 'tenant_id',
              protocol: 'openid-connect',
              protocolMapper: 'oidc-usermodel-attribute-mapper',
              consentRequired: false,
              config: {
                'user.attribute': TENANT_ATTRIBUTE_KEY,
                'id.token.claim': 'true',
                'access.token.claim': 'true',
                'claim.name': TENANT_ATTRIBUTE_KEY,
                'jsonType.label': 'String',
                'userinfo.token.claim': 'true',
              },
            },
            {
              name: 'role',
              protocol: 'openid-connect',
              protocolMapper: 'oidc-usermodel-attribute-mapper',
              consentRequired: false,
              config: {
                'user.attribute': 'tenant_admin',
                'id.token.claim': 'true',
                'access.token.claim': 'true',
                'claim.name': 'tenant_admin',
                'jsonType.label': 'String',
                'userinfo.token.claim': 'true',
              },
            },
          ],
        }),
      },
    );
    if (createClientRes.status === 409) {
      throw new ConflictException(
        `Client with name/id ${clientId} already exists in Keycloak`,
      );
    }
    if (!createClientRes.ok) {
      const body = await createClientRes.text();
      this.logger.error(`Keycloak client creation failed: ${body}`);
      throw new InternalServerErrorException('Keycloak client creation failed');
    }

    const clientsRes = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients?clientId=${encodeURIComponent(clientId)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const clients = (await clientsRes.json()) as KeycloakClientRepresentation[];
    const clientUuid = clients[0]?.id;
    if (!clientUuid) {
      this.logger.error(`Failed to find created client with ID ${clientId}`);
      throw new InternalServerErrorException('Failed to find created client');
    }

    const secretRes = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${clientUuid}/client-secret`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const secretData = (await secretRes.json()) as { value: string };
    const clientSecret = secretData.value;

    const saUserRes = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${clientUuid}/service-account-user`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const saUser = (await saUserRes.json()) as KeycloakUserRepresentation;
    if (!saUser.id) {
      this.logger.error(
        `Failed to find service account user for client ${clientUuid}`,
      );
      throw new InternalServerErrorException(
        'Failed to find service account user',
      );
    }

    const updateSaRes = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${saUser.id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: saUser.username,
          attributes: {
            ...saUser.attributes,
            [TENANT_ATTRIBUTE_KEY]: [tenantId],
            ['role']: ['tenant_admin'],
          },
        }),
      },
    );
    if (!updateSaRes.ok) {
      const body = await updateSaRes.text();
      this.logger.error(`Failed to set tenant_id on service account: ${body}`);
      throw new InternalServerErrorException(
        'Failed to set tenant attributes on Keycloak',
      );
    }

    await this.ensureExclusiveAppRole(
      accessToken,
      saUser.id,
      UsersRole.TENANT_ADMIN,
    );

    return {
      clientId,
      clientSecret,
      keycloakUuid: clientUuid,
    };
  }

  async deleteApiClient(clientUuid: string): Promise<void> {
    this.logger.log(`Deleting API client ${clientUuid}`);
    const accessToken = await this.getAdminAccessToken();
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');

    const response = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${clientUuid}`,
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
      this.logger.error(`Keycloak client delete failed: ${body}`);
      throw new InternalServerErrorException('Keycloak client deletion failed');
    }
  }

  async updateApiClient(clientUuid: string, name: string): Promise<void> {
    this.logger.log(`Updating API client ${clientUuid} name to '${name}'`);
    const accessToken = await this.getAdminAccessToken();
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');

    const response = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/clients/${clientUuid}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Keycloak client update failed: ${body}`);
      throw new InternalServerErrorException('Keycloak client update failed');
    }
  }

  async createTenantAdminUser(
    input: CreateTenantAdminUserInput,
  ): Promise<string> {
    return this.createTenantUser({
      email: input.email,
      username: input.username,
      password: input.password,
      tenantId: input.tenantId,
      role: UsersRole.TENANT_ADMIN,
    });
  }

  async createTenantUser(input: CreateTenantUserInput): Promise<string> {
    this.logger.log(
      `Creating user '${input.email}' for tenant ${input.tenantId}`,
    );
    const accessToken = await this.getAdminAccessToken();
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');
    const response = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: input.username,
          email: input.email,
          enabled: true,
          emailVerified: true,
          requiredActions: [],
          attributes: this.buildUserAttributes(input),
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
      this.logger.error(`Keycloak user creation failed: ${body}`);
      throw new InternalServerErrorException('Keycloak user creation failed');
    }

    const locationHeader = response.headers.get('location');
    if (!locationHeader) {
      this.logger.error('Keycloak user created without location header');
      throw new InternalServerErrorException('Keycloak user creation failed');
    }

    const userId = locationHeader.split('/').pop() ?? '';
    if (!userId) {
      this.logger.error('Keycloak user created with invalid location header');
      throw new InternalServerErrorException('Keycloak user creation failed');
    }

    try {
      await this.ensureExclusiveAppRole(accessToken, userId, input.role);
      const groupId = await this.ensureTenantGroup(accessToken, input.tenantId);
      await this.assignUserToGroup(accessToken, userId, groupId);
    } catch (error) {
      this.logger.error(
        `Role/Group assignment failed for user ${userId}, rolling back...`,
      );
      try {
        await this.deleteUserWithToken(userId, accessToken);
      } catch (rollbackError) {
        const errorMsg =
          rollbackError instanceof Error
            ? rollbackError.message
            : String(rollbackError);
        this.logger.error(`Rollback failed for user ${userId}: ${errorMsg}`);
        throw new InternalServerErrorException(
          'Keycloak user creation failed and cleanup was not possible',
        );
      }
      throw error;
    }

    return userId;
  }

  async getClientCredentialsToken(): Promise<string> {
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');
    const clientId = this.getRequiredEnv('KEYCLOAK_MGMT_CLIENT_ID');
    const clientSecret = this.getRequiredEnv('KEYCLOAK_MGMT_CLIENT_SECRET');

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(
      `${keycloakBaseUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
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
      this.logger.error(`Client credentials token request failed: ${text}`);
      throw new InternalServerErrorException('Keycloak authentication failed');
    }

    const tokenPayload = (await response.json()) as AccessTokenResponse;
    if (!tokenPayload.access_token) {
      throw new InternalServerErrorException(
        'Keycloak client credentials response missing access_token',
      );
    }

    return tokenPayload.access_token;
  }

  async deleteUser(userId: string): Promise<void> {
    if (!userId) return;
    this.logger.log(`Deleting user ${userId}`);
    const accessToken = await this.getAdminAccessToken();
    await this.deleteUserWithToken(userId, accessToken);
  }

  async syncUserApplicationRole(
    userId: string,
    targetRole: UsersRole,
  ): Promise<void> {
    if (!userId) return;
    this.logger.log(`Syncing role for user ${userId} to ${targetRole}`);
    const accessToken = await this.getAdminAccessToken();
    await this.ensureExclusiveAppRole(accessToken, userId, targetRole);
  }

  async updateUser(
    userId: string,
    input: { email?: string; username?: string },
  ): Promise<void> {
    this.logger.log(`Updating user ${userId} details`);
    const accessToken = await this.getAdminAccessToken();
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');

    interface KeycloakUserUpdate {
      email?: string;
      username?: string;
    }

    const updateData: KeycloakUserUpdate = {};
    if (input.email) {
      updateData.email = input.email;
    }
    if (input.username) {
      updateData.username = input.username;
    }

    const response = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Keycloak user update failed: ${body}`);
      throw new InternalServerErrorException('Keycloak user update failed');
    }
  }

  async setUserEnabled(userId: string, enabled: boolean): Promise<void> {
    if (!userId) return;
    this.logger.log(`Setting enabled=${enabled} for user ${userId}`);
    const accessToken = await this.getAdminAccessToken();
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');

    const response = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Keycloak user status update failed: ${body}`);
      throw new InternalServerErrorException(
        'Keycloak user status update failed',
      );
    }
  }

  async updateTenantGroup(
    oldTenantId: string,
    newTenantId: string,
  ): Promise<void> {
    this.logger.log(
      `Updating tenant group from ${oldTenantId} to ${newTenantId}`,
    );
    const accessToken = await this.getAdminAccessToken();
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');

    const oldGroupName = this.buildTenantGroupName(oldTenantId);
    const newGroupName = this.buildTenantGroupName(newTenantId);

    const groupsResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/groups?search=${encodeURIComponent(oldGroupName)}&exact=true`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!groupsResponse.ok) {
      const body = await groupsResponse.text();
      this.logger.error(`Keycloak group lookup failed: ${body}`);
      throw new InternalServerErrorException('Keycloak group update failed');
    }

    const groups =
      (await groupsResponse.json()) as KeycloakGroupRepresentation[];
    const existingGroup = groups.find((group) => group.name === oldGroupName);

    if (existingGroup?.id) {
      const updateResponse = await fetch(
        `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/groups/${existingGroup.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newGroupName }),
        },
      );

      if (!updateResponse.ok) {
        const body = await updateResponse.text();
        this.logger.error(`Keycloak group update failed: ${body}`);
        throw new InternalServerErrorException('Keycloak group update failed');
      }
    }
  }

  async deleteTenantGroup(tenantId: string): Promise<void> {
    this.logger.log(`Deleting tenant group for ${tenantId}`);
    const accessToken = await this.getAdminAccessToken();
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');

    const groupName = this.buildTenantGroupName(tenantId);

    const groupsResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/groups?search=${encodeURIComponent(groupName)}&exact=true`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!groupsResponse.ok) {
      return;
    }

    const groups =
      (await groupsResponse.json()) as KeycloakGroupRepresentation[];
    const existingGroup = groups.find((group) => group.name === groupName);

    if (existingGroup?.id) {
      await fetch(
        `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/groups/${existingGroup.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    }
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

    if (response.status === 404) return;

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Keycloak user delete failed: ${body}`);
      throw new InternalServerErrorException('Keycloak user deletion failed');
    }
  }

  private async ensureExclusiveAppRole(
    accessToken: string,
    userId: string,
    targetRole: UsersRole,
  ): Promise<void> {
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');

    const userRolesResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}/role-mappings/realm`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!userRolesResponse.ok) {
      const body = await userRolesResponse.text();
      this.logger.error(`Keycloak user realm role lookup failed: ${body}`);
      throw new InternalServerErrorException('Role sync failed');
    }

    const assignedRoles =
      (await userRolesResponse.json()) as KeycloakRoleRepresentation[];
    const appRoles = assignedRoles.filter((role) =>
      APPLICATION_ROLES.has(role.name as UsersRole),
    );
    const rolesToRemove = appRoles.filter((role) => role.name !== targetRole);
    if (rolesToRemove.length > 0) {
      const removeResponse = await fetch(
        `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}/role-mappings/realm`,
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
        this.logger.error(`Keycloak realm role cleanup failed: ${body}`);
        throw new InternalServerErrorException('Role sync cleanup failed');
      }
    }

    const hasTargetRole = appRoles.some((role) => role.name === targetRole);
    if (hasTargetRole) return;

    const roleResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/roles/${targetRole}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!roleResponse.ok) {
      const body = await roleResponse.text();
      this.logger.error(`Keycloak realm role lookup failed: ${body}`);
      throw new InternalServerErrorException('Role sync failed');
    }

    const role = (await roleResponse.json()) as KeycloakRoleRepresentation;
    if (!role.id || !role.name) {
      throw new InternalServerErrorException(
        'Keycloak realm role payload is invalid',
      );
    }

    const assignResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}/role-mappings/realm`,
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
      this.logger.error(`Keycloak realm role assignment failed: ${body}`);
      throw new InternalServerErrorException('Role sync failed');
    }
  }

  private async ensureTenantGroup(
    accessToken: string,
    tenantId: string,
  ): Promise<string> {
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');
    const groupName = this.buildTenantGroupName(tenantId);

    const groupsResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/groups?search=${encodeURIComponent(groupName)}&exact=true`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!groupsResponse.ok) {
      const body = await groupsResponse.text();
      this.logger.error(`Keycloak group lookup failed: ${body}`);
      throw new InternalServerErrorException('Group sync failed');
    }

    const groups =
      (await groupsResponse.json()) as KeycloakGroupRepresentation[];
    const existingGroup = groups.find((group) => group.name === groupName);
    if (existingGroup?.id) {
      return existingGroup.id;
    }

    const createGroupResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/groups`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: groupName }),
      },
    );

    if (!createGroupResponse.ok && createGroupResponse.status !== 409) {
      const body = await createGroupResponse.text();
      this.logger.error(`Keycloak group creation failed: ${body}`);
      throw new InternalServerErrorException('Group sync failed');
    }

    const refreshedGroupsResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/groups?search=${encodeURIComponent(groupName)}&exact=true`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!refreshedGroupsResponse.ok) {
      const body = await refreshedGroupsResponse.text();
      this.logger.error(`Keycloak group lookup failed: ${body}`);
      throw new InternalServerErrorException('Group sync failed');
    }

    const refreshedGroups =
      (await refreshedGroupsResponse.json()) as KeycloakGroupRepresentation[];
    const createdGroup = refreshedGroups.find(
      (group) => group.name === groupName,
    );

    if (!createdGroup?.id) {
      this.logger.error(
        `Keycloak group not found after creation: ${groupName}`,
      );
      throw new InternalServerErrorException('Group sync failed');
    }

    return createdGroup.id;
  }

  private async assignUserToGroup(
    accessToken: string,
    userId: string,
    groupId: string,
  ): Promise<void> {
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const keycloakRealm = this.getRequiredEnv('KEYCLOAK_REALM');

    const response = await fetch(
      `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/users/${userId}/groups/${groupId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok && response.status !== 204) {
      const body = await response.text();
      this.logger.error(`Keycloak group assignment failed: ${body}`);
      throw new InternalServerErrorException('Group sync failed');
    }
  }

  private async getAdminAccessToken(): Promise<string> {
    const keycloakBaseUrl = this.getRequiredEnv('KEYCLOAK_URL');
    const adminRealm = this.configService.get<string>(
      'KEYCLOAK_ADMIN_REALM',
      'notip',
    );
    const clientId = this.configService.get<string>(
      'KEYCLOAK_MGMT_CLIENT_ID',
      'notip-mgmt-backend',
    );
    const clientSecret = this.getRequiredEnv('KEYCLOAK_MGMT_CLIENT_SECRET');

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
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
      this.logger.error(`Keycloak admin token request failed: ${text}`);
      throw new InternalServerErrorException('Keycloak authentication failed');
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
      this.logger.error(`Missing required environment variable: ${key}`);
      throw new InternalServerErrorException('Configuration error');
    }
    return value;
  }

  private buildTenantGroupName(tenantId: string): string {
    return `Tenant-${tenantId}`;
  }

  private buildUserAttributes(
    input: CreateTenantUserInput,
  ): Record<string, string[]> {
    if (input.role === UsersRole.SYSTEM_ADMIN) {
      return {
        role: [input.role],
      };
    }
    return {
      role: [input.role],
      [TENANT_ATTRIBUTE_KEY]: [input.tenantId],
    };
  }
}
