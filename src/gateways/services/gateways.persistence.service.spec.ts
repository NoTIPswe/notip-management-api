import { GatewaysPersistenceService } from './gateways.persistence.service';
import { DEFAULT_GATEWAY_SEND_FREQUENCY_MS } from '../gateway.constants';

describe('GatewaysPersistenceService', () => {
  it('returns tenant gateways with relations and ordering', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([{ id: 'gateway-1' }]),
    };
    const service = new GatewaysPersistenceService(repo as never);

    await expect(
      service.getGateways({ tenantId: 'tenant-1' }),
    ).resolves.toEqual([{ id: 'gateway-1' }]);
    expect(repo.find).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      relations: ['metadata'],
      order: { createdAt: 'DESC' },
    });
  });

  it('finds a gateway by scoped id', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue({ id: 'gateway-1' }),
    };
    const service = new GatewaysPersistenceService(repo as never);

    await expect(
      service.findById({ tenantId: 'tenant-1', gatewayId: 'gateway-1' }),
    ).resolves.toEqual({ id: 'gateway-1' });
  });

  it('finds a gateway by unscoped id', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue({ id: 'gateway-1' }),
    };
    const service = new GatewaysPersistenceService(repo as never);

    await expect(service.findByIdUnscoped('gateway-1')).resolves.toEqual({
      id: 'gateway-1',
    });
  });

  it('finds a gateway by factory id with selected fields', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue({ id: 'gateway-1' }),
    };
    const service = new GatewaysPersistenceService(repo as never);

    await expect(service.findByFactoryId('factory-1')).resolves.toEqual({
      id: 'gateway-1',
    });
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { factoryId: 'factory-1' },
      select: [
        'id',
        'tenantId',
        'factoryId',
        'factoryKeyHash',
        'provisioned',
        'model',
        'firmwareVersion',
        'createdAt',
        'updatedAt',
      ],
      relations: ['metadata'],
    });
  });

  it('updates existing metadata when a name is provided', async () => {
    const gateway = {
      id: 'gateway-1',
      metadata: { name: 'Old Name', sendFrequencyMs: 30000 },
    };
    const repo = {
      save: jest.fn().mockResolvedValue({
        ...gateway,
        metadata: { ...gateway.metadata, name: 'New Name' },
      }),
    };
    const service = new GatewaysPersistenceService(repo as never);
    jest.spyOn(service, 'findById').mockResolvedValue(gateway as never);

    const result = await service.updateGateway({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      name: 'New Name',
    });

    expect(result).not.toBeNull();
    expect(result?.metadata?.name).toBe('New Name');
  });

  it('returns null when updating a missing gateway', async () => {
    const repo = {};
    const service = new GatewaysPersistenceService(repo as never);
    jest.spyOn(service, 'findById').mockResolvedValue(null);

    await expect(
      service.updateGateway({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        name: 'New Name',
      }),
    ).resolves.toBeNull();
  });

  it('creates metadata when updating a name on a gateway without metadata', async () => {
    const gateway = { id: 'gateway-1', metadata: null };
    const savedGateway = {
      id: 'gateway-1',
      metadata: {
        gatewayId: 'gateway-1',
        gateway,
        name: 'New Name',
        sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
      },
    };
    const repo = {
      save: jest.fn().mockResolvedValue(savedGateway),
    };
    const service = new GatewaysPersistenceService(repo as never);
    jest.spyOn(service, 'findById').mockResolvedValue(gateway as never);

    const result = await service.updateGateway({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      name: 'New Name',
    });

    expect(result).toEqual(savedGateway);
  });

  it('returns null when deleting a missing gateway', async () => {
    const repo = {};
    const service = new GatewaysPersistenceService(repo as never);
    jest.spyOn(service, 'findById').mockResolvedValue(null);

    await expect(
      service.deleteGateway({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
      }),
    ).resolves.toBeNull();
  });

  it('removes a gateway when deleted', async () => {
    const gateway = { id: 'gateway-1' };
    const repo = {
      remove: jest.fn().mockResolvedValue(gateway),
    };
    const service = new GatewaysPersistenceService(repo as never);
    jest.spyOn(service, 'findById').mockResolvedValue(gateway as never);

    await expect(
      service.deleteGateway({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
      }),
    ).resolves.toEqual(gateway);
    expect(repo.remove).toHaveBeenCalledWith(gateway);
  });
});
