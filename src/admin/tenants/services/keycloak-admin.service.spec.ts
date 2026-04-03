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
        username: 'Tenant Admin',
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
        username: 'Tenant User',
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

  it('creates SYSTEM_ADMIN user with username and without tenant_id attribute', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location:
            'http://localhost:8080/admin/realms/notip/users/kc-user-sys',
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'system-admin-role-id', name: UsersRole.SYSTEM_ADMIN }],
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'group-system', name: 'Tenant-tenant-system' }],
        }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'sys-admin@example.com',
        username: 'system-admin-user',
        password: 'Password_123!',
        tenantId: 'tenant-system',
        role: UsersRole.SYSTEM_ADMIN,
      }),
    ).resolves.toBe('kc-user-sys');

    const createUserCall = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const requestBody = createUserCall.body;

    if (typeof requestBody !== 'string') {
      throw new Error('Expected create user request body to be a string');
    }

    const parsed = JSON.parse(requestBody) as {
      username?: string;
      attributes?: Record<string, string[]>;
    };

    expect(parsed.username).toBe('system-admin-user');
    expect(parsed.attributes).toEqual({
      role: [UsersRole.SYSTEM_ADMIN],
    });
  });

  it('throws conflict when tenant user already exists', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 409 }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_USER,
      }),
    ).rejects.toThrow('User already exists in Keycloak');
  });

  it('throws when tenant user creation request fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'user create failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_USER,
      }),
    ).rejects.toThrow('Keycloak user creation failed');
  });

  it('throws when tenant user location header is missing', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 201 }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_USER,
      }),
    ).rejects.toThrow('Keycloak user creation failed');
  });

  it('throws when tenant user location header is invalid', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location: 'http://localhost:8080/admin/realms/notip/users/',
        }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_USER,
      }),
    ).rejects.toThrow('Keycloak user creation failed');
  });

  it('rolls back user creation when role assignment fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location:
            'http://localhost:8080/admin/realms/notip/users/kc-user-rollback',
        }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'role lookup failed' }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_USER,
      }),
    ).rejects.toThrow('Role sync failed');

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/users/kc-user-rollback'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('throws cleanup error when rollback fails after assignment error', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location:
            'http://localhost:8080/admin/realms/notip/users/kc-user-rollback-fail',
        }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'role lookup failed' }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'delete failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_USER,
      }),
    ).rejects.toThrow('cleanup was not possible');
  });

  it('rolls back when tenant group lookup fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location:
            'http://localhost:8080/admin/realms/notip/users/kc-user-group-lookup',
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'tenant-admin-role-id', name: UsersRole.TENANT_ADMIN }],
        }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'group lookup failed' }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_ADMIN,
      }),
    ).rejects.toThrow('Group sync failed');
  });

  it('rolls back when tenant group creation fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location:
            'http://localhost:8080/admin/realms/notip/users/kc-user-group-create',
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'tenant-admin-role-id', name: UsersRole.TENANT_ADMIN }],
        }),
      )
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] }))
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'group create failed' }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_ADMIN,
      }),
    ).rejects.toThrow('Group sync failed');
  });

  it('rolls back when refreshed tenant group lookup fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location:
            'http://localhost:8080/admin/realms/notip/users/kc-user-group-refresh-fail',
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'tenant-admin-role-id', name: UsersRole.TENANT_ADMIN }],
        }),
      )
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] }))
      .mockResolvedValueOnce(createResponse({ status: 201 }))
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'group refresh failed' }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_ADMIN,
      }),
    ).rejects.toThrow('Group sync failed');
  });

  it('rolls back when tenant group is still missing after creation', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location:
            'http://localhost:8080/admin/realms/notip/users/kc-user-group-missing',
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'tenant-admin-role-id', name: UsersRole.TENANT_ADMIN }],
        }),
      )
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] }))
      .mockResolvedValueOnce(createResponse({ status: 201 }))
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] }))
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_ADMIN,
      }),
    ).rejects.toThrow('Group sync failed');
  });

  it('rolls back when assigning user to tenant group fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location:
            'http://localhost:8080/admin/realms/notip/users/kc-user-group-assign-fail',
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'tenant-admin-role-id', name: UsersRole.TENANT_ADMIN }],
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'group-1', name: 'Tenant-tenant-1' }],
        }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'group assignment failed' }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createTenantUser({
        email: 'tenant-user@example.com',
        username: 'Tenant User',
        password: 'Password_123!',
        tenantId: 'tenant-1',
        role: UsersRole.TENANT_ADMIN,
      }),
    ).rejects.toThrow('Group sync failed');
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

  it('throws when API client creation fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'client create failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createApiClient('My Client', 'tenant-1'),
    ).rejects.toThrow('Keycloak client creation failed');
  });

  it('throws when created API client cannot be found', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 201 }))
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createApiClient('My Client', 'tenant-1'),
    ).rejects.toThrow('Failed to find created client');
  });

  it('throws when service account user is missing after client creation', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 201 }))
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: [{ id: 'client-uuid-1' }] }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { value: 'client-secret-1' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: { username: 'service-account-client' },
        }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createApiClient('My Client', 'tenant-1'),
    ).rejects.toThrow('Failed to find service account user');
  });

  it('throws when setting service account tenant attributes fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 201 }))
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: [{ id: 'client-uuid-1' }] }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { value: 'client-secret-1' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: { id: 'sa-user-id', username: 'service-account-client' },
        }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'attribute update failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.createApiClient('My Client', 'tenant-1'),
    ).rejects.toThrow('Failed to set tenant attributes on Keycloak');
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

  it('returns without error when deleting a missing API client', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 404 }));

    const service = new KeycloakAdminService(configService);

    await expect(
      service.deleteApiClient('missing-client'),
    ).resolves.toBeUndefined();
  });

  it('throws when deleting an API client fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'client delete failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(service.deleteApiClient('client-uuid-1')).rejects.toThrow(
      'Keycloak client deletion failed',
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

  it('throws when updating an API client fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'client update failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.updateApiClient('client-uuid-1', 'New Name'),
    ).rejects.toThrow('Keycloak client update failed');
  });

  it('updates a user email and username', async () => {
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
      username: 'new-username',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/user-uuid-1'),
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"username":"new-username"') as unknown,
      }),
    );
  });

  it('throws when updating user details fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'user update failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.updateUser('user-uuid-1', {
        email: 'new@example.com',
        username: 'new-username',
      }),
    ).rejects.toThrow('Keycloak user update failed');
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

  it('throws when updating user enabled status fails', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'status update failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(service.setUserEnabled('user-uuid-1', false)).rejects.toThrow(
      'Keycloak user status update failed',
    );
  });

  it('returns early when syncUserApplicationRole is called without user id', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const service = new KeycloakAdminService(configService);

    await expect(
      service.syncUserApplicationRole('', UsersRole.TENANT_ADMIN),
    ).resolves.toBeUndefined();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('syncs user role when user already has target role', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'role-1', name: UsersRole.TENANT_ADMIN }],
        }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.syncUserApplicationRole('user-uuid-1', UsersRole.TENANT_ADMIN),
    ).resolves.toBeUndefined();
  });

  it('throws when role cleanup fails during sync', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'role-1', name: UsersRole.TENANT_USER }],
        }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'cleanup failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.syncUserApplicationRole('user-uuid-1', UsersRole.TENANT_ADMIN),
    ).rejects.toThrow('Role sync cleanup failed');
  });

  it('throws when target role lookup fails during sync', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] }))
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'role lookup failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.syncUserApplicationRole('user-uuid-1', UsersRole.TENANT_ADMIN),
    ).rejects.toThrow('Role sync failed');
  });

  it('throws when target role payload is invalid during sync', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] }))
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { id: 'role-only' } }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.syncUserApplicationRole('user-uuid-1', UsersRole.TENANT_ADMIN),
    ).rejects.toThrow('Keycloak realm role payload is invalid');
  });

  it('throws when role assignment fails during sync', async () => {
    const configService = createConfigService();
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(createResponse({ status: 200, json: [] }))
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: { id: 'role-id', name: UsersRole.TENANT_ADMIN },
        }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 500, text: 'assignment failed' }),
      );

    const service = new KeycloakAdminService(configService);

    await expect(
      service.syncUserApplicationRole('user-uuid-1', UsersRole.TENANT_ADMIN),
    ).rejects.toThrow('Role sync failed');
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

    it('throws error if group rename fails', async () => {
      const configService = createConfigService();
      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

      fetchMock
        .mockResolvedValueOnce(
          createResponse({ status: 200, json: { access_token: 'token' } }),
        )
        .mockResolvedValueOnce(
          createResponse({
            status: 200,
            json: [{ id: 'group-id', name: 'Tenant-old' }],
          }),
        )
        .mockResolvedValueOnce(
          createResponse({ status: 500, text: 'rename failed' }),
        );

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

    it('throws error when access token is missing in payload', async () => {
      const configService = createConfigService();
      const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

      fetchMock.mockResolvedValueOnce(
        createResponse({ status: 200, json: {} }),
      );

      const service = new KeycloakAdminService(configService);
      await expect(service.getClientCredentialsToken()).rejects.toThrow(
        'Keycloak client credentials response missing access_token',
      );
    });
  });
});
