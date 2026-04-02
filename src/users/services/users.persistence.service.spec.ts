import { In } from 'typeorm';
import { UsersPersistenceService } from './users.persistence.service';

describe('UsersPersistenceService', () => {
  it('returns tenant users', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([{ id: 'user-1' }]),
    };
    const service = new UsersPersistenceService(repo as never);

    await expect(service.getUsers('tenant-1')).resolves.toEqual([
      { id: 'user-1' },
    ]);
    expect(repo.find).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
  });

  it('creates and saves a user', async () => {
    const createdUser = {
      tenantId: 'tenant-1',
      id: 'kc-user-1',
      email: 'user@example.com',
      name: 'User',
      role: 'tenant_user',
      permissions: null,
    };
    const savedUser = { ...createdUser };
    const repo = {
      create: jest.fn().mockReturnValue(createdUser),
      save: jest.fn().mockResolvedValue(savedUser),
    };
    const service = new UsersPersistenceService(repo as never);

    await expect(
      service.createUser({
        tenantId: 'tenant-1',
        id: 'kc-user-1',
        email: 'user@example.com',
        name: 'User',
        role: 'tenant_user',
      } as never),
    ).resolves.toEqual(expect.objectContaining({ id: 'kc-user-1' }));
  });

  it('updates an existing user', async () => {
    const existing = { id: 'user-1', name: 'Old' };
    const savedUser = { id: 'user-1', name: 'New' };
    const repo = {
      findOne: jest.fn().mockResolvedValue(existing),
      save: jest.fn().mockResolvedValue(savedUser),
    };
    const service = new UsersPersistenceService(repo as never);

    await expect(
      service.updateUser({
        id: 'user-1',
        tenantId: 'tenant-1',
        name: 'New',
      } as never),
    ).resolves.toEqual(expect.objectContaining({ name: 'New' }));
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1', tenantId: 'tenant-1' },
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', name: 'New' }),
    );
  });

  it('returns null when updating a missing user', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = new UsersPersistenceService(repo as never);

    await expect(
      service.updateUser({ id: 'user-1', tenantId: 'tenant-1' } as never),
    ).resolves.toBeNull();
  });

  it('returns the number of deleted users', async () => {
    const repo = {
      delete: jest.fn().mockResolvedValue({ affected: 2 }),
    };
    const service = new UsersPersistenceService(repo as never);

    await expect(
      service.deleteUsersByIds(['1', '2'], 'tenant-1'),
    ).resolves.toBe(2);
    expect(repo.delete).toHaveBeenCalledWith({
      id: In(['1', '2']),
      tenantId: 'tenant-1',
    });
  });
});
