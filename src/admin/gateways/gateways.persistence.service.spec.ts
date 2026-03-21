import { GatewaysPersistenceService } from './gateways.persistence.service';

describe('Admin GatewaysPersistenceService', () => {
  it('returns all gateways when no tenant filter is provided', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([{ id: 'gateway-1' }]),
    };
    const service = new GatewaysPersistenceService(repo as never);

    await expect(service.getGateways({ tenantId: undefined })).resolves.toEqual(
      [{ id: 'gateway-1' }],
    );
    expect(repo.find).toHaveBeenCalledWith({ where: {} });
  });

  it('returns gateways filtered by tenant', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([{ id: 'gateway-1' }]),
    };
    const service = new GatewaysPersistenceService(repo as never);

    await service.getGateways({ tenantId: 'tenant-1' });
    expect(repo.find).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
  });

  it('creates and saves a gateway', async () => {
    const createdGateway = {
      tenant: { id: 'tenant-1' },
      factoryId: 'factory-1',
      factoryKeyHash: 'hash',
      model: 'unknown-model',
      firmwareVersion: '0.0.0',
    };
    const savedGateway = {
      id: 'gateway-1',
      ...createdGateway,
    };
    const repo = {
      create: jest.fn().mockReturnValue(createdGateway),
      save: jest.fn().mockResolvedValue(savedGateway),
    };
    const service = new GatewaysPersistenceService(repo as never);

    await expect(
      service.addGateway({
        tenantId: 'tenant-1',
        factoryId: 'factory-1',
        factoryKeyHash: 'hash',
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'gateway-1' }));

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'unknown-model',
        firmwareVersion: '0.0.0',
      }),
    );
  });
});
