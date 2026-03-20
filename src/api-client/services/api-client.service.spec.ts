import { NotFoundException } from '@nestjs/common';
import { ApiClientService } from './api-client.service';
import { ApiClientPersistenceService } from './api-client.persistence.service';

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
      createApiClient: jest.fn().mockResolvedValue(createApiClientEntity()),
    } as unknown as ApiClientPersistenceService;
    const service = new ApiClientService(persistence);

    await expect(service.createApiClient('Primary Client')).resolves.toEqual(
      expect.objectContaining({
        id: 'client-1',
        name: 'Primary Client',
      }),
    );
  });

  it('returns mapped api clients', async () => {
    const persistence = {
      getApiClients: jest.fn().mockResolvedValue([createApiClientEntity()]),
    } as unknown as ApiClientPersistenceService;
    const service = new ApiClientService(persistence);

    await expect(service.getApiClients()).resolves.toEqual([
      expect.objectContaining({
        id: 'client-1',
        keycloakClientId: 'kc-client-1',
      }),
    ]);
  });

  it('throws when deleting a missing api client', async () => {
    const persistence = {
      deleteApiClient: jest.fn().mockResolvedValue(null),
    } as unknown as ApiClientPersistenceService;
    const service = new ApiClientService(persistence);

    await expect(service.deleteApiClient('client-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolves when deleting an existing api client', async () => {
    const persistence = {
      deleteApiClient: jest.fn().mockResolvedValue({ affected: 1 }),
    } as unknown as ApiClientPersistenceService;
    const service = new ApiClientService(persistence);

    await expect(service.deleteApiClient('client-1')).resolves.toBeUndefined();
  });
});
