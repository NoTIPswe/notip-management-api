import { KeysController } from './keys.controller';
import { KeysService } from '../services/keys.service';

describe('KeysController', () => {
  it('delegates key lookup to the service', async () => {
    const getKeysMock = jest.fn().mockResolvedValue([{ id: 'key-1' }]);
    const service = {
      getKeys: getKeysMock,
    } as unknown as KeysService;
    const controller = new KeysController(service);

    await expect(controller.getKeys('gateway-1')).resolves.toEqual([
      { id: 'key-1' },
    ]);
    expect(getKeysMock).toHaveBeenCalledWith('gateway-1');
  });
});
