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

  it('creates tenant admin and enforces a single application role mapping', async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        return env[key as keyof typeof env] ?? defaultValue;
      }),
    } as unknown as ConfigService;

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: { access_token: 'admin-token' } }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 201,
          location: 'http://localhost:8080/admin/realms/notip/users/kc-user-1',
        }),
      )
      .mockResolvedValueOnce(
        createResponse({ status: 200, json: [{ id: 'client-uuid-1' }] }),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: [{ id: 'old-role-id', name: UsersRole.TENANT_USER }],
        }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }))
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          json: { id: 'tenant-admin-role-id', name: UsersRole.TENANT_ADMIN },
        }),
      )
      .mockResolvedValueOnce(createResponse({ status: 204 }));

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
    expect(calls).toHaveLength(7);

    const createUserRequest = calls[1]?.[1] as RequestInit;
    const createUserRequestBody = createUserRequest.body;
    if (typeof createUserRequestBody !== 'string') {
      throw new Error('Expected create user request body to be a string');
    }
    const createUserBody = JSON.parse(createUserRequestBody) as {
      requiredActions?: string[];
      credentials?: Array<{ temporary?: boolean }>;
    };
    expect(createUserBody.requiredActions).toEqual([]);
    expect(createUserBody.credentials?.[0]?.temporary).toBe(false);

    expect(calls[4]?.[1]).toEqual(
      expect.objectContaining({
        method: 'DELETE',
      }),
    );

    expect(calls[6]?.[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
      }),
    );

    const assignmentRequest = calls[6]?.[1] as RequestInit;
    expect(assignmentRequest.body).toContain(UsersRole.TENANT_ADMIN);
  });
});
