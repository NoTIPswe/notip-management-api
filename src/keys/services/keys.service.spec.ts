import { KeysService } from './keys.service';
import { GatewaysKeysPersistenceService } from './keys.persistence.service';

const createKeyEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'key-1',
  gatewayId: 'gateway-1',
  keyMaterial: Buffer.from('secret'),
  keyVersion: 1,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  revokedAt: null,
  ...overrides,
});

describe('KeysService', () => {
  it('returns mapped keys', async () => {
    const persistence = {
      getKeys: jest.fn().mockResolvedValue([createKeyEntity()]),
    } as unknown as GatewaysKeysPersistenceService;
    const service = new KeysService(persistence);

    await expect(service.getKeys('gateway-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'key-1',
        gatewayId: 'gateway-1',
        keyVersion: 1,
      }),
    ]);
  });

  it('saves keys and returns the mapped key', async () => {
    const persistence = {
      saveKeys: jest.fn().mockResolvedValue(createKeyEntity()),
    } as unknown as GatewaysKeysPersistenceService;
    const service = new KeysService(persistence);
    const keyMaterial = Buffer.from('secret');

    await expect(
      service.saveKeys('gateway-1', keyMaterial, 1),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'key-1',
        gatewayId: 'gateway-1',
        keyVersion: 1,
      }),
    );
  });
});
