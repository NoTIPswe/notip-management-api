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

    await expect(service.createApiClient('Primary Client')).resolves.toEqual(
      expect.objectContaining({ id: 'client-1', name: 'Primary Client' }),
    );
  });

  it('returns all api clients', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([{ id: 'client-1' }]),
    };
    const service = new ApiClientPersistenceService(repo as never);

    await expect(service.getApiClients()).resolves.toEqual([
      { id: 'client-1' },
    ]);
  });

  it('returns null when the api client does not exist', async () => {
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const service = new ApiClientPersistenceService(repo as never);

    await expect(service.deleteApiClient('client-1')).resolves.toBeNull();
  });

  it('deletes an existing api client', async () => {
    const repo = {
      findOneBy: jest.fn().mockResolvedValue({ id: 'client-1' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ApiClientPersistenceService(repo as never);

    await expect(service.deleteApiClient('client-1')).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith('client-1');
  });
});
