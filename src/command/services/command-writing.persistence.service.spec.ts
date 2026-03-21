import { Repository } from 'typeorm';
import { CommandWritingPersistenceService } from './command-writing.persistence.service';
import { CommandEntity } from '../entities/command.entity';
import { CommandStatus } from '../enums/command-status.enum';

const createRepositoryMock = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

describe('CommandWritingPersistenceService', () => {
  it('updates existing command status', async () => {
    const repository = createRepositoryMock();
    const entity = {
      id: 'cmd-1',
      status: CommandStatus.QUEUED,
      ackReceivedAt: null,
    } as CommandEntity;
    repository.findOne.mockResolvedValue(entity);
    repository.save.mockResolvedValue({ ...entity, status: CommandStatus.ACK });

    const service = new CommandWritingPersistenceService(
      repository as unknown as Repository<CommandEntity>,
    );

    const timestamp = new Date('2024-01-02T00:00:00.000Z');
    const result = await service.updateStatus({
      commandId: 'cmd-1',
      status: CommandStatus.ACK,
      timestamp,
    });

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'cmd-1' } });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: CommandStatus.ACK,
        ackReceivedAt: timestamp,
      }),
    );
    expect(result?.status).toBe(CommandStatus.ACK);
  });

  it('returns null when command missing', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue(null);
    const service = new CommandWritingPersistenceService(
      repository as unknown as Repository<CommandEntity>,
    );

    await expect(
      service.updateStatus({
        commandId: 'missing',
        status: CommandStatus.ACK,
        timestamp: new Date(),
      }),
    ).resolves.toBeNull();
  });
});
