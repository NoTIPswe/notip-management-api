import { CommandsAckConsumer } from './commands-ack.consumer';
import { CommandWritingPersistenceService } from './command-writing.persistence.service';
import { CommandStatus } from '../enums/command-status.enum';
import { JetStreamClient, JetStreamHandler } from '../../nats/jetstream.client';

const createWritingPersistenceMock = () => ({
  updateStatus: jest.fn(),
  applyAckedCommandEffects: jest.fn(),
});

const createMockJetStream = (): {
  jetStream: JetStreamClient;
  handlers: Map<string, JetStreamHandler>;
  emit: (payload: unknown) => Promise<void>;
} => {
  const handlers = new Map<string, JetStreamHandler>();
  const jetStream = {
    subscribe: jest.fn((subject: string, handler: JetStreamHandler) => {
      handlers.set(subject, handler);
      return Promise.resolve();
    }),
    subscribeCore: jest.fn(),
    publish: jest.fn(),
    request: jest.fn(),
  } as unknown as JetStreamClient;
  const emit = async (payload: unknown) => {
    const handler = handlers.get('command.ack.>');
    if (handler) {
      await handler({
        data: Buffer.from(JSON.stringify(payload)),
        ack: () => {},
      });
    }
  };
  return { jetStream, handlers, emit };
};

describe('CommandsAckConsumer', () => {
  it('subscribes to jetstream and updates command status', async () => {
    const { jetStream, emit } = createMockJetStream();
    const writingPersistence = createWritingPersistenceMock();
    writingPersistence.updateStatus.mockResolvedValue({ id: 'cmd-1' });
    const consumer = new CommandsAckConsumer(
      jetStream,
      writingPersistence as unknown as CommandWritingPersistenceService,
    );

    await consumer.onModuleInit();

    await emit({
      command_id: 'cmd-1',
      status: 'ack',
      timestamp: '2024-01-02T00:00:00.000Z',
    });

    expect(writingPersistence.updateStatus).toHaveBeenCalledWith({
      commandId: 'cmd-1',
      status: CommandStatus.ACK,
      timestamp: new Date('2024-01-02T00:00:00.000Z'),
    });
    expect(writingPersistence.applyAckedCommandEffects).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cmd-1' }),
    );
  });

  it('ignores malformed payloads', async () => {
    const { jetStream, emit } = createMockJetStream();
    const writingPersistence = createWritingPersistenceMock();
    const consumer = new CommandsAckConsumer(
      jetStream,
      writingPersistence as unknown as CommandWritingPersistenceService,
    );

    await consumer.onModuleInit();
    await emit({ invalid: true });

    expect(writingPersistence.updateStatus).not.toHaveBeenCalled();
  });
});
