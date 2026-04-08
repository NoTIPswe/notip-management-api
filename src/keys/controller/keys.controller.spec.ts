import { KeysController } from './keys.controller';
import { KeysService } from '../services/keys.service';

describe('KeysController', () => {
  it('delegates key lookup to the service', async () => {
    const keyMaterial = Buffer.from('material-1');

    const getKeysMock = jest.fn().mockResolvedValue([
      {
        gatewayId: 'gateway-1',
        keyMaterial,
        keyVersion: 1,
      },
    ]);
    const service = {
      getKeys: getKeysMock,
    } as unknown as KeysService;
    const controller = new KeysController(service);

    await expect(controller.getKeys('tenant-1', 'gateway-1')).resolves.toEqual([
      {
        gatewayId: 'gateway-1',
        keyMaterial: keyMaterial.toString('base64'),
        keyVersion: 1,
      },
    ]);
    expect(getKeysMock).toHaveBeenCalledWith('gateway-1', 'tenant-1');
  });
});
