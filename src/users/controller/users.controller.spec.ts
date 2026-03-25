import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { UsersRole } from '../enums/users.enum';
import { UserModel } from '../models/user.model';
import { CreateUserRequestDto } from '../dto/create-user.request.dto';
import { UpdateUserRequestDto } from '../dto/update-user.request.dto';
import { DeleteUserRequestDto } from '../dto/delete-user.request.dto';

const createUserModel = (overrides: Partial<UserModel> = {}): UserModel => {
  const model = new UserModel();
  model.id = 'user-1';
  model.tenantId = 'tenant-1';
  model.email = 'a@b.com';
  model.name = 'Name';
  model.role = UsersRole.TENANT_USER;
  model.lastAccess = null;
  model.createdAt = new Date('2024-01-01T00:00:00.000Z');
  Object.assign(model, overrides);
  return model;
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(() => {
    service = {
      getUsers: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUsers: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;
    controller = new UsersController(service);
  });

  describe('getUserById', () => {
    it('returns a user', async () => {
      service.getUsers.mockResolvedValue([createUserModel()]);
      await expect(
        controller.getUserById('tenant-1', 'user-1'),
      ).resolves.toEqual(
        expect.objectContaining({
          id: 'user-1',
          email: 'a@b.com',
        }),
      );
    });
  });

  describe('getUsers', () => {
    it('returns users', async () => {
      service.getUsers.mockResolvedValue([createUserModel()]);
      await expect(controller.getUsers('tenant-1')).resolves.toEqual([
        expect.objectContaining({
          id: 'user-1',
          email: 'a@b.com',
        }),
      ]);
    });
  });

  describe('createUser', () => {
    it('creates a user', async () => {
      const dto: CreateUserRequestDto = {
        email: 'new@b.com',
        name: 'New',
        role: UsersRole.TENANT_USER,
        password: 'password123',
      };
      service.createUser.mockResolvedValue(
        createUserModel({ ...dto, id: 'new-id' }),
      );

      await expect(controller.createUser('tenant-1', dto)).resolves.toEqual(
        expect.objectContaining({
          id: 'new-id',
          email: 'new@b.com',
        }),
      );
    });
  });

  describe('updateUser', () => {
    it('updates a user', async () => {
      const dto: UpdateUserRequestDto = {
        email: 'upd@b.com',
        name: 'Upd',
        role: UsersRole.TENANT_ADMIN,
        permissions: [],
      };
      service.updateUser.mockResolvedValue(
        createUserModel({ ...dto, id: 'id' }),
      );

      await expect(
        controller.updateUser('tenant-1', 'id', dto),
      ).resolves.toEqual(
        expect.objectContaining({
          id: 'id',
          email: 'upd@b.com',
        }),
      );
    });
  });

  describe('deleteUsers', () => {
    it('deletes users', async () => {
      const dto: DeleteUserRequestDto = { ids: ['u1', 'u2'] };
      service.deleteUsers.mockResolvedValue(2);

      await expect(
        controller.deleteUsers('req-1', UsersRole.TENANT_ADMIN, dto),
      ).resolves.toEqual({
        deleted: 2,
        failed: [],
      });
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(service.deleteUsers).toHaveBeenCalledWith({
        ids: ['u1', 'u2'],
        requesterId: 'req-1',
        requesterRole: UsersRole.TENANT_ADMIN,
      });
    });
  });
});
