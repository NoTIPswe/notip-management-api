import { ApiClientPersistenceService } from './api-client.persistence.service';

describe('ApiClientPersistenceService', () => {
  it('creates and saves an api client', async () => {
    const createdApiClient = {
      name: 'Primary Client',
    };
    const savedApiClient = {
      id: 'client-1',
      name: 'Primary Client',
    };
    const repo = {
      create: jest.fn().mockReturnValue(createdApiClient),
      save: jest.fn().mockResolvedValue(savedApiClient),
    };
    const service = new ApiClientPersistenceService(repo as never);

    await expect(
      service.createApiClient(
        'client-1',
        'tenant-1',
        'Primary Client',
        'kc-client-1',
      ),
    ).resolves.toEqual(
      expect.objectContaining({ id: 'client-1', name: 'Primary Client' }),
    );
  });

  it('finds an api client by name', async () => {
    const repo = {
      findOneBy: jest.fn().mockResolvedValue({ id: 'client-1' }),
    };
    const service = new ApiClientPersistenceService(repo as never);

    await expect(
      service.findByName('tenant-1', 'Primary Client'),
    ).resolves.toEqual({ id: 'client-1' });
    expect(repo.findOneBy).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      name: 'Primary Client',
    });
  });

  it('returns api clients for a tenant', async () => {
    const repo = {
      findBy: jest.fn().mockResolvedValue([{ id: 'client-1' }]),
    };
    const service = new ApiClientPersistenceService(repo as never);

    await expect(service.getApiClients('tenant-1')).resolves.toEqual([
      { id: 'client-1' },
    ]);
    expect(repo.findBy).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
  });

  it('returns null when the api client does not exist', async () => {
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const service = new ApiClientPersistenceService(repo as never);

    await expect(service.deleteApiClient('client-1')).resolves.toBeNull();
  });

  it('deletes an existing api client', async () => {
    const apiClient = { id: 'client-1' };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(apiClient),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ApiClientPersistenceService(repo as never);

    await expect(service.deleteApiClient('client-1')).resolves.toBe('client-1');
    expect(repo.remove).toHaveBeenCalledWith(apiClient);
  });
});
