import { ApiClientController } from './api-client.controller';
import { ApiClientService } from './api-client.service';

const apiClient = {
  id: 'client-1',
  tenantId: 'tenant-1',
  name: 'Primary Client',
  keycloakClientId: 'kc-client-1',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('ApiClientController', () => {
  it('creates an api client and maps the response', async () => {
    const service = {
      createApiClient: jest.fn().mockResolvedValue(apiClient),
    } as unknown as ApiClientService;
    const controller = new ApiClientController(service);

    await expect(
      controller.createApiClient({ name: 'Primary Client' }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'client-1',
        clientId: 'kc-client-1',
      }),
    );
  });

  it('returns mapped api clients', async () => {
    const service = {
      getApiClients: jest.fn().mockResolvedValue([apiClient]),
    } as unknown as ApiClientService;
    const controller = new ApiClientController(service);

    await expect(controller.getApiClients()).resolves.toEqual([
      expect.objectContaining({
        id: 'client-1',
        clientId: 'kc-client-1',
      }),
    ]);
  });

  it('delegates deletion to the service', async () => {
    const deleteApiClientMock = jest.fn().mockResolvedValue(undefined);
    const service = {
      deleteApiClient: deleteApiClientMock,
    } as unknown as ApiClientService;
    const controller = new ApiClientController(service);

    await expect(
      controller.deleteApiClient('client-1'),
    ).resolves.toBeUndefined();
    expect(deleteApiClientMock).toHaveBeenCalledWith('client-1');
  });
});
