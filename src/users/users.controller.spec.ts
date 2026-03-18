import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  it('delegates user lookup to the service', async () => {
    const getUsersMock = jest.fn().mockResolvedValue([{ id: 'user-1' }]);
    const service = {
      getUsers: getUsersMock,
    } as unknown as UsersService;
    const controller = new UsersController(service);

    await expect(controller.getUsers('tenant-1')).resolves.toEqual([
      { id: 'user-1' },
    ]);
    expect(getUsersMock).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
  });
});
