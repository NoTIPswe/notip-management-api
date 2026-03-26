/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NatsJetStreamClient } from './nats-jetstream.client';
import * as nats from 'nats';

jest.mock('nats', () => {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
  const actual = jest.requireActual('nats');
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
  return {
    ...actual,
    connect: jest.fn(),
    consumerOpts: jest.fn(),
    createInbox: jest.fn().mockReturnValue('inbox'),
  };
});

describe('NatsJetStreamClient', () => {
  let client: NatsJetStreamClient;
  let natsConnectMock: jest.Mock;
  let consumerOptsMock: jest.Mock;
  let mockConnection: nats.NatsConnection;
  let mockJetStream: nats.JetStreamClient;

  beforeEach(async () => {
    natsConnectMock = nats.connect as jest.Mock;
    consumerOptsMock = nats.consumerOpts as jest.Mock;

    const mockOpts = {
      manualAck: jest.fn().mockReturnThis(),
      ackExplicit: jest.fn().mockReturnThis(),
      deliverTo: jest.fn().mockReturnThis(),
      deliverNew: jest.fn().mockReturnThis(),
      durable: jest.fn().mockReturnThis(),
    };
    consumerOptsMock.mockReturnValue(mockOpts);

    mockJetStream = {
      subscribe: jest.fn().mockResolvedValue({
        [Symbol.asyncIterator]: jest.fn().mockReturnValue({
          next: jest.fn().mockResolvedValue({ done: true }),
        }),
        unsubscribe: jest.fn(),
      }),
      publish: jest.fn().mockResolvedValue({ ack: true }),
    } as unknown as nats.JetStreamClient;
    mockConnection = {
      jetstream: jest.fn().mockReturnValue(mockJetStream),
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as nats.NatsConnection;
    natsConnectMock.mockResolvedValue(mockConnection);

    const module: TestingModule = await Test.createTestingModule({
      providers: [NatsJetStreamClient],
    }).compile();

    client = module.get<NatsJetStreamClient>(NatsJetStreamClient);
  });

  afterEach(async () => {
    await client.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  it('should connect only once', async () => {
    await client.publish('test', Buffer.from('data'));
    await client.publish('test', Buffer.from('data'));

    expect(natsConnectMock).toHaveBeenCalledTimes(1);
  });

  it('should publish messages', async () => {
    const data = Buffer.from('hello');
    await client.publish('test.subject', data);

    expect(mockJetStream.publish).toHaveBeenCalledWith('test.subject', data);
  });

  it('should subscribe to subjects', async () => {
    const handler = jest.fn();
    await client.subscribe('test.subject', handler);

    expect(mockJetStream.subscribe).toHaveBeenCalledWith(
      'test.subject',
      expect.any(Object) as unknown,
    );
  });

  it('should build a sanitized durable name for subscriptions', async () => {
    process.env.NATS_DURABLE_PREFIX = 'prefix';
    const durableMock = jest.fn().mockReturnThis();
    consumerOptsMock.mockReturnValue({
      manualAck: jest.fn().mockReturnThis(),
      ackExplicit: jest.fn().mockReturnThis(),
      deliverTo: jest.fn().mockReturnThis(),
      deliverNew: jest.fn().mockReturnThis(),
      durable: durableMock,
    });

    await client.subscribe('test.subject.with.dots', jest.fn());

    expect(durableMock).toHaveBeenCalledWith('prefix_test_subject_with_dots');
  });

  it('should close connection on destroy', async () => {
    await client.publish('test', Buffer.from('data'));
    await client.onModuleDestroy();

    expect(mockConnection.drain).toHaveBeenCalled();
    expect(mockConnection.close).toHaveBeenCalled();
  });

  describe('Connection Options', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
      delete process.env.NATS_TOKEN;
      delete process.env.NATS_USER;
      delete process.env.NATS_PASSWORD;
      delete process.env.NATS_SERVERS;
      delete process.env.NATS_URL;
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should use token-based authentication', async () => {
      process.env.NATS_TOKEN = 'test-token';
      await client.publish('test', Buffer.from('data'));

      expect(nats.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'test-token',
        }),
      );
    });

    it('should use user/password authentication', async () => {
      process.env.NATS_USER = 'user';
      process.env.NATS_PASSWORD = 'pass';
      await client.publish('test', Buffer.from('data'));

      expect(nats.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user',
          pass: 'pass',
        }),
      );
    });

    it('should use default server if none provided', async () => {
      await client.publish('test', Buffer.from('data'));

      expect(nats.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          servers: ['nats://localhost:4222'],
        }),
      );
    });

    it('should resolve multiple servers', async () => {
      process.env.NATS_SERVERS = 'nats://1.1.1.1:4222, nats://2.2.2.2:4222';
      await client.publish('test', Buffer.from('data'));

      expect(nats.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          servers: ['nats://1.1.1.1:4222', 'nats://2.2.2.2:4222'],
        }),
      );
    });
  });

  describe('Publish Error Handling', () => {
    it('should log warning on duplicate message', async () => {
      (mockJetStream.publish as jest.Mock).mockResolvedValue({
        duplicate: true,
      });
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */
      const loggerWarnSpy = jest.spyOn((client as any).logger, 'warn');

      await client.publish('test', Buffer.from('data'));
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('duplicate message') as unknown,
      );
    });

    it('should throw and log error on publish failure', async () => {
      const error = new Error('publish failed');
      (mockJetStream.publish as jest.Mock).mockRejectedValue(error);
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */
      const loggerErrorSpy = jest.spyOn((client as any).logger, 'error');

      await expect(client.publish('test', Buffer.from('data'))).rejects.toThrow(
        error,
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish') as unknown,
        error,
      );
    });
  });

  describe('Request Handling', () => {
    it('should request data and return the response payload', async () => {
      const requestMock = jest
        .fn()
        .mockResolvedValue({ data: Uint8Array.from(Buffer.from('reply')) });
      mockConnection = {
        ...mockConnection,
        request: requestMock,
      } as unknown as nats.NatsConnection;
      natsConnectMock.mockResolvedValue(mockConnection);

      await expect(
        client.request('test.subject', Buffer.from('ping')),
      ).resolves.toEqual(Buffer.from('reply'));
      expect(requestMock).toHaveBeenCalledWith(
        'test.subject',
        Buffer.from('ping'),
        { timeout: 5000 },
      );
    });

    it('should throw and log error on request failure', async () => {
      const error = new Error('request failed');
      const requestMock = jest.fn().mockRejectedValue(error);
      mockConnection = {
        ...mockConnection,
        request: requestMock,
      } as unknown as nats.NatsConnection;
      natsConnectMock.mockResolvedValue(mockConnection);
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */
      const loggerErrorSpy = jest.spyOn((client as any).logger, 'error');

      await expect(
        client.request('test.subject', Buffer.from('ping')),
      ).rejects.toThrow(error);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to request') as unknown,
        error,
      );
    });
  });

  it('should call onApplicationShutdown', async () => {
    const closeConnectionSpy = jest.spyOn(client as any, 'closeConnection');
    await client.onApplicationShutdown();
    expect(closeConnectionSpy).toHaveBeenCalled();
  });
});
