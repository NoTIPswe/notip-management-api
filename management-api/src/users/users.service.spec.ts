import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRole } from './enums/users.enum';
import { UsersPersistenceService } from './users.persistence.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersPersistenceService: {
    getUsers: jest.Mock;
    createUser: jest.Mock;
    updateUser: jest.Mock;
    deleteUsersByIds: jest.Mock;
  };

  beforeEach(async () => {
    usersPersistenceService = {
      getUsers: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUsersByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersPersistenceService,
          useValue: usersPersistenceService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('passes tenantId to persistence when loading users', async () => {
    usersPersistenceService.getUsers.mockResolvedValue([
      {
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'user@example.com',
        name: 'User',
        role: UsersRole.TENANT_USER,
        createdAt: new Date(),
      },
    ]);

    await service.getUsers({ tenantId: 'tenant-1' });

    expect(usersPersistenceService.getUsers).toHaveBeenCalledWith('tenant-1');
  });

  it('throws 404 when the tenant has no users', async () => {
    usersPersistenceService.getUsers.mockResolvedValue([]);

    await expect(service.getUsers({ tenantId: 'tenant-1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('passes tenantId to persistence when creating a user', async () => {
    usersPersistenceService.createUser.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'user@example.com',
      name: 'User',
      role: UsersRole.TENANT_ADMIN,
      createdAt: new Date(),
    });

    await service.createUser({
      tenantId: 'tenant-1',
      email: 'user@example.com',
      name: 'User',
      role: UsersRole.TENANT_ADMIN,
      password: 'secret',
    });

    expect(usersPersistenceService.createUser).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      email: 'user@example.com',
      name: 'User',
      role: UsersRole.TENANT_ADMIN,
      password: 'secret',
    });
  });
});
