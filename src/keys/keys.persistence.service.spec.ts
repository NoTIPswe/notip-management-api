import { GatewaysKeysPersistenceService } from './keys.persistence.service';

describe('GatewaysKeysPersistenceService', () => {
  it('returns keys for a gateway', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([{ id: 'key-1' }]),
    };
    const service = new GatewaysKeysPersistenceService(repo as never);

    await expect(service.getKeys('gateway-1')).resolves.toEqual([
      { id: 'key-1' },
    ]);
    expect(repo.find).toHaveBeenCalledWith({
      where: { gatewayId: 'gateway-1' },
    });
  });

  it('creates and saves a key', async () => {
    const createdKey = {
      gatewayId: 'gateway-1',
      keyMaterial: Buffer.from('secret'),
      keyVersion: 1,
    };
    const savedKey = {
      id: 'key-1',
      ...createdKey,
    };
    const repo = {
      create: jest.fn().mockReturnValue(createdKey),
      save: jest.fn().mockResolvedValue(savedKey),
    };
    const service = new GatewaysKeysPersistenceService(repo as never);

    await expect(
      service.saveKeys('gateway-1', Buffer.from('secret'), 1),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'key-1',
        gatewayId: 'gateway-1',
        keyVersion: 1,
      }),
    );
  });
});
