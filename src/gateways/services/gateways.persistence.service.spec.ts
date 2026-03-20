import { GatewaysPersistenceService } from './gateways.persistence.service';

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

  it('returns null when decommissioning a missing gateway', async () => {
    const repo = {};
    const service = new GatewaysPersistenceService(repo as never);
    jest.spyOn(service, 'findById').mockResolvedValue(null);

    await expect(
      service.decommissionGateway({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
      }),
    ).resolves.toBeNull();
  });

  it('marks a gateway as not provisioned when decommissioned', async () => {
    const gateway = { id: 'gateway-1', provisioned: true };
    const savedGateway = { id: 'gateway-1', provisioned: false };
    const repo = {
      save: jest.fn().mockResolvedValue(savedGateway),
    };
    const service = new GatewaysPersistenceService(repo as never);
    jest.spyOn(service, 'findById').mockResolvedValue(gateway as never);

    await expect(
      service.decommissionGateway({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
      }),
    ).resolves.toEqual(expect.objectContaining({ provisioned: false }));
  });
});
