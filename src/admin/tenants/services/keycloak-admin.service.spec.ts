import { ConfigService } from '@nestjs/config';
import { KeycloakAdminService } from './keycloak-admin.service';
import { UsersRole } from '../../../users/enums/users.enum';

const env = {
  KEYCLOAK_URL: 'http://localhost:8080',
  KEYCLOAK_REALM: 'notip',
  KEYCLOAK_ADMIN_REALM: 'master',
  KEYCLOAK_ADMIN_CLIENT_ID: 'admin-cli',
  KEYCLOAK_ADMIN_USER: 'admin',
  KEYCLOAK_ADMIN_PASSWORD: 'admin',
  KEYCLOAK_MGMT_CLIENT_ID: 'notip-mgmt',
  KEYCLOAK_MGMT_CLIENT_SECRET: 'secret',
};

const createResponse = ({
  status,
  json,
  text,
  location,
}: {
  status: number;
  json?: unknown;
  text?: string;
  location?: string;
}): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(json),
    text: jest
      .fn()
      .mockResolvedValue(text ?? (json ? JSON.stringify(json) : '')),
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'location' ? (location ?? null) : null,
    } as Headers,
  }) as unknown as Response;

describe('KeycloakAdminService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    global.fetch = jest.fn();
  });

  const createConfigService = (): ConfigService =>
    ({
      get: jest.fn((key: string, defaultValue?: string) => {
        return env[key as keyof typeof env] ?? defaultValue;
      }),
    }) as unknown as ConfigService;

  it('creates tenant admin and enforces a single application role mapping', async () => {
    const configService = createConfigService();

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      ) // Admin Login
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location: 'http://localhost:8080/admin/realms/notip/users/kc-user-1',
        }),
      ) // Create User
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'old-role-id', name: UsersRole.TENANT_USER }],
        }),
      ) // Get Assigned Roles
      .mockResolvedValueOnce(createResponse({ status: 204 })) // Delete Old Role
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: { id: 'tenant-admin-role-id', name: UsersRole.TENANT_ADMIN },
        }),
      ) // Get Target Role
      .mockResolvedValueOnce(createResponse({ status: 204 })) // Assign New Role
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] })) // Find Group (initial)
      .mockResolvedValueOnce(createResponse({ status: 201 })) // Create Group
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'group-1', name: 'Tenant-tenant-1' }],
        }),
      ) // Find Group (after create)
      .mockResolvedValueOnce(createResponse({ status: 204 })); // Assign to Group

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantAdminUser({
        email: 'tenant-admin@example.com',
        name: 'Tenant Admin',
        password: 'Password_123!',
        tenantId: 'tenant-1',
      }),
    ).resolves.toBe('kc-user-1');

    const calls = fetchMock.mock.calls;
    expect(calls).toHaveLength(10);

    const createUserRequest = calls[1]?.[1] as RequestInit;
    const createUserRequestBody = createUserRequest.body;
    if (typeof createUserRequestBody !== 'string') {
      throw new Error('Expected create user request body to be a string');
    }
    const createUserBody = JSON.parse(createUserRequestBody) as {
      requiredActions?: string[];
      credentials?: Array<{ temporary?: boolean }>;
      attributes?: Record<string, string[]>;
    };
    expect(createUserBody.requiredActions).toEqual([]);
    expect(createUserBody.credentials?.[0]?.temporary).toBe(false);
    expect(createUserBody.attributes).toEqual({
      role: [UsersRole.TENANT_ADMIN],
      tenant_id: ['tenant-1'],
    });

    expect(calls[3]?.[1]).toEqual(
      expect.objectContaining({
        method: 'DELETE',
      }),
    );

    expect(calls[5]?.[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
      }),
    );

    const assignmentRequest = calls[5]?.[1] as RequestInit;
    expect(assignmentRequest.body).toContain(UsersRole.TENANT_ADMIN);

    expect(calls[6]?.[0]).toContain(
      '/groups?search=Tenant-tenant-1&exact=true',
    );
    expect(calls[7]?.[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(calls[8]?.[0]).toContain(
      '/groups?search=Tenant-tenant-1&exact=true',
    );
    expect(calls[9]?.[0]).toContain('/users/kc-user-1/groups/group-1');
    expect(calls[9]?.[1]).toEqual(
      expect.objectContaining({
        method: 'PUT',
      }),
    );
  });

  it('creates tenant users in the same tenant group and keeps tenant_id aligned', async () => {
    const configService = createConfigService();

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      ) // Admin Login
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location: 'http://localhost:8080/admin/realms/notip/users/kc-user-2',
        }),
      ) // Create User
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] })) // Get Assigned Roles (empty)
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: { id: 'tenant-user-role-id', name: UsersRole.TENANT_USER },
        }),
      ) // Get Target Role
      .mockResolvedValueOnce(createResponse({ status: 204 })) // Assign New Role
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'group-tenant-7', name: 'Tenant-tenant-7' }],
        }),
      ) // Find Group
      .mockResolvedValueOnce(createResponse({ status: 204 })); // Assign to Group

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        name: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-7',
        role: UsersRole.TENANT_USER,
      }),
    ).resolves.toBe('kc-user-2');

    const calls = fetchMock.mock.calls;
    expect(calls).toHaveLength(7);

    const createUserRequest = calls[1]?.[1] as RequestInit;
    const createUserRequestBody = createUserRequest.body;
    if (typeof createUserRequestBody !== 'string') {
      throw new Error('Expected create user request body to be a string');
    }

    const createUserBody = JSON.parse(createUserRequestBody) as {
      attributes?: Record<string, string[]>;
    };
    expect(createUserBody.attributes).toEqual({
      role: [UsersRole.TENANT_USER],
      tenant_id: ['tenant-7'],
    });

    expect(calls[5]?.[0]).toContain(
      '/groups?search=Tenant-tenant-7&exact=true',
    );
    expect(calls[6]?.[0]).toContain('/users/kc-user-2/groups/group-tenant-7');
    expect(calls[6]?.[1]).toEqual(
      expect.objectContaining({
        method: 'PUT',
      }),
    );
  });

  it('creates API client for a tenant', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      ) // Admin Login
      .mockResolvedValueOnce(createResponse({ status: 201 })) // Create Client
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: [{ id: 'client-uuid-1' }] }),
      ) // Get Client UUID
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { value: 'client-secret-1' } }),
      ) // Get Secret
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: { id: 'sa-user-id', username: 'service-account-client' },
        }),
      ) // Get SA User
      .mockResolvedValueOnce(createResponse({ status: 204 })) // Update SA User (attributes)
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] })) // ensureExclusiveAppRole: Get Assigned
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: { id: 'admin-role-id', name: UsersRole.TENANT_ADMIN },
        }),
      ) // ensureExclusiveAppRole: Get Target Role
      .mockResolvedValueOnce(createResponse({ status: 204 })); // ensureExclusiveAppRole: Assign

    const service = new KeycloakAdminService(configService);

    const result = await service.createApiClient('My Client', 'tenant-1');

    expect(result).toEqual({
      clientId: 'my-client',
      clientSecret: 'client-secret-1',
      keycloakUuid: 'client-uuid-1',
    });
  });

  it('deletes an API client', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);
    await service.deleteApiClient('client-uuid-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/clients/client-uuid-1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('updates an API client name', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);
    await service.updateApiClient('client-uuid-1', 'New Name');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/clients/client-uuid-1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      }),
    );
  });

  it('updates a user email and name', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);
    await service.updateUser('user-uuid-1', {
      email: 'new@example.com',
      name: 'New Name',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/user-uuid-1'),
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining(
          '"username":"new@example.com"',
        ) as unknown,
      }),
    );
  });

  it('updates user enabled status', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);
    await service.setUserEnabled('user-uuid-1', false);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/user-uuid-1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ enabled: false }),
      }),
    );
  });

  it('deletes a user', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);
    await service.deleteUser('user-uuid-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/user-uuid-1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
  it('throws InternalServerErrorException when required env is missing', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const service = new KeycloakAdminService(configService);
    await expect(service.getClientCredentialsToken()).rejects.toThrow(
      'Configuration error',
    );
  });

  it('handles 409 Conflict when creating a client', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 409 }));

    const service = new KeycloakAdminService(configService);
    await expect(
      service.createApiClient('Existing', 'tenant-1'),
    ).rejects.toThrow(
      'Client with name/id existing already exists in Keycloak',
    );
  });

  it('throws InternalServerErrorException when admin token request fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock.mockResolvedValueOnce(
      createResponse({ status: 500, text: 'Internal Server Error' }),
    );

    const service = new KeycloakAdminService(configService);
    await expect(service.deleteUser('user-1')).rejects.toThrow(
      'Keycloak authentication failed',
    );
  });

  it('throws InternalServerErrorException when admin token is missing in response', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock.mockResolvedValueOnce(createResponse({ status: 200, json: {} }));

    const service = new KeycloakAdminService(configService);
    await expect(service.deleteUser('user-1')).rejects.toThrow(
      'Keycloak admin token response missing access_token',
    );
  });

  describe('updateTenantGroup', () => {
    it('updates tenant group when it exists', async () => {
      const configService = createConfigService();
      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

      fetchMock
        .mockResolvedValueOnce(
          createResponse({ status: 200, json: { access_token: 'token' } }),
        ) // token
        .mockResolvedValueOnce(
          createResponse({
            status: 200,
            json: [{ id: 'group-id', name: 'Tenant-old' }],
          }),
        ) // lookup
        .mockResolvedValueOnce(createResponse({ status: 204 })); // update

      const service = new KeycloakAdminService(configService);
      await service.updateTenantGroup('old', 'new');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/groups/group-id'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Tenant-new' }),
        }),
      );
    });

    it('does nothing if group does not exist', async () => {
      const configService = createConfigService();
      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

      fetchMock
        .mockResolvedValueOnce(
          createResponse({ status: 200, json: { access_token: 'token' } }),
        )
        .mockResolvedValueOnce(createResponse({ status: 200, json: [] }));

      const service = new KeycloakAdminService(configService);
      await service.updateTenantGroup('old', 'new');

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('throws error if lookup fails', async () => {
      const configService = createConfigService();
      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

      fetchMock
        .mockResolvedValueOnce(
          createResponse({ status: 200, json: { access_token: 'token' } }),
        )
        .mockResolvedValueOnce(createResponse({ status: 500 }));

      const service = new KeycloakAdminService(configService);
      await expect(service.updateTenantGroup('old', 'new')).rejects.toThrow(
        'Keycloak group update failed',
      );
    });
  });

  describe('deleteTenantGroup', () => {
    it('deletes tenant group when it exists', async () => {
      const configService = createConfigService();
      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

      fetchMock
        .mockResolvedValueOnce(
          createResponse({ status: 200, json: { access_token: 'token' } }),
        )
        .mockResolvedValueOnce(
          createResponse({
            status: 200,
            json: [{ id: 'group-id', name: 'Tenant-id' }],
          }),
        )
        .mockResolvedValueOnce(createResponse({ status: 204 }));

      const service = new KeycloakAdminService(configService);
      await service.deleteTenantGroup('id');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/groups/group-id'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('returns early if lookup fails', async () => {
      const configService = createConfigService();
      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

      fetchMock
        .mockResolvedValueOnce(
          createResponse({ status: 200, json: { access_token: 'token' } }),
        )
        .mockResolvedValueOnce(createResponse({ status: 500 }));

      const service = new KeycloakAdminService(configService);
      await service.deleteTenantGroup('id');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('getClientCredentialsToken', () => {
    it('returns access token on success', async () => {
      const configService = createConfigService();
      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

      fetchMock.mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'token' } }),
      );

      const service = new KeycloakAdminService(configService);
      const token = await service.getClientCredentialsToken();
      expect(token).toBe('token');
    });

    it('throws error on failure', async () => {
      const configService = createConfigService();
      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

      fetchMock.mockResolvedValueOnce(createResponse({ status: 401 }));

      const service = new KeycloakAdminService(configService);
      await expect(service.getClientCredentialsToken()).rejects.toThrow(
        'Keycloak authentication failed',
      );
    });
  });
});
