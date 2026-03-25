import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApiClientService } from './api-client.service';
import { ApiClientPersistenceService } from './api-client.persistence.service';
import { KeycloakAdminService } from '../../admin/tenants/services/keycloak-admin.service';

const createApiClientEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'client-1',
  tenantId: 'tenant-1',
  name: 'Primary Client',
  keycloakClientId: 'kc-client-1',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('ApiClientService', () => {
  it('creates an api client', async () => {
    const persistence = {
      findByName: jest.fn().mockResolvedValue(null),
      createApiClient: jest.fn().mockResolvedValue(createApiClientEntity()),
    } as unknown as ApiClientPersistenceService;
    const keycloakAdminService = {
      createApiClient: jest.fn().mockResolvedValue({
        clientId: 'kc-client-1',
        clientSecret: 'secret',
        keycloakUuid: 'client-1',
      }),
    } as unknown as jest.Mocked<KeycloakAdminService>;
    const service = new ApiClientService(persistence, keycloakAdminService);

    await expect(
      service.createApiClient('tenant-1', 'Primary Client'),
    ).resolves.toMatchObject({
      model: {
        id: 'client-1',
        name: 'Primary Client',
      },
      clientSecret: 'secret',
    });
  });

  it('throws ConflictException when name exists', async () => {
    const persistence = {
      findByName: jest.fn().mockResolvedValue(createApiClientEntity()),
    } as unknown as ApiClientPersistenceService;
    const keycloakAdminService = {
      createApiClient: jest.fn(),
    } as unknown as jest.Mocked<KeycloakAdminService>;
    const service = new ApiClientService(persistence, keycloakAdminService);

    await expect(
      service.createApiClient('tenant-1', 'Primary Client'),
    ).rejects.toThrow(ConflictException);
  });

  it('returns mapped api clients', async () => {
    const persistence = {
      getApiClients: jest.fn().mockResolvedValue([createApiClientEntity()]),
    } as unknown as ApiClientPersistenceService;
    const keycloakAdminService = {
      createApiClient: jest.fn(),
      deleteApiClient: jest.fn(),
    } as unknown as jest.Mocked<KeycloakAdminService>;
    const service = new ApiClientService(persistence, keycloakAdminService);

    await expect(service.getApiClients('tenant-1')).resolves.toMatchObject([
      {
        id: 'client-1',
        keycloakClientId: 'kc-client-1',
      },
    ]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(persistence.getApiClients).toHaveBeenCalledWith('tenant-1');
  });

  it('throws when deleting a missing api client', async () => {
    const persistence = {
      deleteApiClient: jest.fn().mockResolvedValue(null),
    } as unknown as ApiClientPersistenceService;
    const keycloakAdminService = {
      createApiClient: jest.fn(),
      deleteApiClient: jest.fn(),
    } as unknown as jest.Mocked<KeycloakAdminService>;
    const service = new ApiClientService(persistence, keycloakAdminService);

    await expect(service.deleteApiClient('client-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolves when deleting an existing api client', async () => {
    const persistence = {
      deleteApiClient: jest.fn().mockResolvedValue('client-1'),
    } as unknown as ApiClientPersistenceService;
    const keycloakAdminService = {
      deleteApiClient: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<KeycloakAdminService>;
    const service = new ApiClientService(persistence, keycloakAdminService);

    await expect(service.deleteApiClient('client-1')).resolves.toBeUndefined();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(keycloakAdminService.deleteApiClient).toHaveBeenCalledWith(
      'client-1',
    );
  });

  it('rolls back Keycloak client creation if DB save fails', async () => {
    const keycloakAdminService = {
      createApiClient: jest.fn().mockResolvedValue({
        clientId: 'kc-client-1',
        clientSecret: 'secret',
        keycloakUuid: 'client-1',
      }),
      deleteApiClient: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<KeycloakAdminService>;
    const persistence = {
      findByName: jest.fn().mockResolvedValue(null),
      createApiClient: jest.fn().mockRejectedValue(new Error('DB failure')),
    } as unknown as ApiClientPersistenceService;
    const service = new ApiClientService(persistence, keycloakAdminService);

    await expect(service.createApiClient('tenant-1', 'Client')).rejects.toThrow(
      'DB failure',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(keycloakAdminService.deleteApiClient).toHaveBeenCalledWith(
      'client-1',
    );
  });

  it('logs error if Keycloak rollback fails', async () => {
    const keycloakAdminService = {
      createApiClient: jest.fn().mockResolvedValue({
        clientId: 'kc-client-1',
        clientSecret: 'secret',
        keycloakUuid: 'client-1',
      }),
      deleteApiClient: jest
        .fn()
        .mockRejectedValue(new Error('Rollback failure')),
    } as unknown as jest.Mocked<KeycloakAdminService>;
    const persistence = {
      findByName: jest.fn().mockResolvedValue(null),
      createApiClient: jest.fn().mockRejectedValue(new Error('DB failure')),
    } as unknown as ApiClientPersistenceService;
    const service = new ApiClientService(persistence, keycloakAdminService);

    await expect(service.createApiClient('tenant-1', 'Client')).rejects.toThrow(
      'DB failure',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(keycloakAdminService.deleteApiClient).toHaveBeenCalledWith(
      'client-1',
    );
  });

  it('ignores Keycloak deletion failure in deleteApiClient', async () => {
    const persistence = {
      deleteApiClient: jest.fn().mockResolvedValue('client-uuid-1'),
    } as unknown as ApiClientPersistenceService;
    const keycloakAdminService = {
      deleteApiClient: jest
        .fn()
        .mockRejectedValue(new Error('Keycloak failure')),
    } as unknown as jest.Mocked<KeycloakAdminService>;
    const service = new ApiClientService(persistence, keycloakAdminService);

    await expect(service.deleteApiClient('client-1')).resolves.toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(keycloakAdminService.deleteApiClient).toHaveBeenCalledWith(
      'client-uuid-1',
    );
  });
});
