import { GatewaysPersistenceService } from './gateways.persistence.service';
import { DEFAULT_GATEWAY_SEND_FREQUENCY_MS } from '../gateway.constants';
import { GatewayStatus } from '../enums/gateway.enum';

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

  it('updates runtime status and last seen timestamp on existing metadata', async () => {
    const now = new Date('2026-04-04T17:00:00.000Z');
    const gateway = {
      id: 'gateway-1',
      metadata: {
        status: GatewayStatus.GATEWAY_OFFLINE,
        lastSeenAt: null,
        sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
      },
    };
    const savedGateway = {
      ...gateway,
      metadata: {
        ...gateway.metadata,
        status: GatewayStatus.GATEWAY_ONLINE,
        lastSeenAt: now,
      },
    };
    const repo = {
      save: jest.fn().mockResolvedValue(savedGateway),
    };
    const service = new GatewaysPersistenceService(repo as never);
    jest.spyOn(service, 'findByIdUnscoped').mockResolvedValue(gateway as never);

    await expect(
      service.updateGatewayRuntimeStatus({
        gatewayId: 'gateway-1',
        status: GatewayStatus.GATEWAY_ONLINE,
        lastSeenAt: now,
      }),
    ).resolves.toEqual(savedGateway);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('creates metadata when runtime status update finds none', async () => {
    const now = new Date('2026-04-04T17:00:00.000Z');
    const gateway = { id: 'gateway-1', metadata: null };
    const savedGateway = {
      id: 'gateway-1',
      metadata: {
        gatewayId: 'gateway-1',
        status: GatewayStatus.GATEWAY_ONLINE,
        lastSeenAt: now,
        sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
      },
    };
    const repo = {
      save: jest.fn().mockResolvedValue(savedGateway),
    };
    const service = new GatewaysPersistenceService(repo as never);
    jest.spyOn(service, 'findByIdUnscoped').mockResolvedValue(gateway as never);

    await expect(
      service.updateGatewayRuntimeStatus({
        gatewayId: 'gateway-1',
        status: GatewayStatus.GATEWAY_ONLINE,
        lastSeenAt: now,
      }),
    ).resolves.toEqual(savedGateway);
    expect(savedGateway.metadata).toEqual(
      expect.objectContaining({
        gatewayId: 'gateway-1',
        status: GatewayStatus.GATEWAY_ONLINE,
        lastSeenAt: now,
        sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
      }),
    );
  });

  it('returns null when runtime status update target gateway is missing', async () => {
    const repo = {
      save: jest.fn(),
    };
    const service = new GatewaysPersistenceService(repo as never);
    jest.spyOn(service, 'findByIdUnscoped').mockResolvedValue(null);

    await expect(
      service.updateGatewayRuntimeStatus({
        gatewayId: 'gateway-1',
        status: GatewayStatus.GATEWAY_OFFLINE,
        lastSeenAt: new Date('2026-04-04T17:00:00.000Z'),
      }),
    ).resolves.toBeNull();
    expect(repo.save).not.toHaveBeenCalled();
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
