import { Repository } from 'typeorm';
import { CommandPersistenceService } from './command.persistence.service';
import { CommandEntity } from '../entities/command.entity';
import { CommandType } from '../enums/command-type.enum';
import { CommandStatus } from '../enums/command-status.enum';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
});

describe('CommandPersistenceService', () => {
  it('creates queued commands', async () => {
    const repository = createRepositoryMock();
    repository.create.mockReturnValue({} as CommandEntity);
    repository.save.mockResolvedValue({
      id: 'cmd-1',
    } as CommandEntity);
    const service = new CommandPersistenceService(
      repository as unknown as Repository<CommandEntity>,
    );

    const result = await service.queueCommand({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      type: CommandType.CONFIG,
      status: CommandStatus.QUEUED,
      issuedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        status: CommandStatus.QUEUED,
      }),
    );
    expect(result.id).toBe('cmd-1');
  });

  it('finds commands by identifiers', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue({ id: 'cmd-1' } as CommandEntity);
    const service = new CommandPersistenceService(
      repository as unknown as Repository<CommandEntity>,
    );

    const result = await service.findCommand({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      commandId: 'cmd-1',
    });

    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'cmd-1',
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
      },
    });
    expect(result?.id).toBe('cmd-1');
  });

  it('counts commands for a tenant', async () => {
    const repository = createRepositoryMock();
    repository.count.mockResolvedValue(3);
    const service = new CommandPersistenceService(
      repository as unknown as Repository<CommandEntity>,
    );

    await expect(service.countCommands('tenant-1')).resolves.toBe(3);
    expect(repository.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
    });
  });
});
