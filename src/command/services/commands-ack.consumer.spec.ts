import { CommandsAckConsumer } from './commands-ack.consumer';
import { MockJetStreamClient } from '../../nats/mock-jetstream.client';
import { CommandWritingPersistenceService } from './command-writing.persistence.service';
import { CommandStatus } from '../enums/command-status.enum';

const createWritingPersistenceMock = () => ({
  updateStatus: jest.fn(),
});

describe('CommandsAckConsumer', () => {
  it('subscribes to jetstream and updates command status', async () => {
    const jetStream = new MockJetStreamClient();
    const writingPersistence = createWritingPersistenceMock();
    const consumer = new CommandsAckConsumer(
      jetStream,
      writingPersistence as unknown as CommandWritingPersistenceService,
    );

    await consumer.onModuleInit();

    await jetStream.emit({
      commandId: 'cmd-1',
      status: 'ack',
      timestamp: '2024-01-02T00:00:00.000Z',
    });

    expect(writingPersistence.updateStatus).toHaveBeenCalledWith({
      commandId: 'cmd-1',
      status: CommandStatus.ACK,
      timestamp: new Date('2024-01-02T00:00:00.000Z'),
    });
  });

  it('ignores malformed payloads', async () => {
    const jetStream = new MockJetStreamClient();
    const writingPersistence = createWritingPersistenceMock();
    const consumer = new CommandsAckConsumer(
      jetStream,
      writingPersistence as unknown as CommandWritingPersistenceService,
    );

    await consumer.onModuleInit();
    await jetStream.emit({ invalid: true });

    expect(writingPersistence.updateStatus).not.toHaveBeenCalled();
  });
});
