import {
  connect,
  ConnectionOptions,
  JSONCodec,
  Msg,
  NatsConnection,
  Subscription,
} from 'nats';
import { GatewayStatus } from '../enums/gateway.enum';
import { GatewayStatusNatsResponderService } from './gateway-status-nats-responder.service';
import { GatewaysService } from './gateways.service';

jest.mock('nats', () => {
  const actual = jest.requireActual<typeof import('nats')>('nats');
  return {
    ...actual,
    connect: jest.fn(),
  };
});

type TestConnection = Pick<
  NatsConnection,
  'publish' | 'subscribe' | 'drain' | 'close'
>;
type TestLogger = Pick<Console, 'log' | 'warn' | 'error'>;
type UpdateResponse =
  | { success: true }
  | { success: false; error: 'INVALID_PAYLOAD' | 'NOT_FOUND' | 'INTERNAL' };
type ServiceInternals = {
  connection: TestConnection | null;
  subscription: Subscription | null;
  logger: TestLogger;
  consumeRequests(subscription: Subscription): Promise<void>;
  handleUpdate(msg: Msg): Promise<UpdateResponse>;
  resolveServers(): string[];
  buildConnectionOptions(servers: string[]): ConnectionOptions;
};

const getInternals = (
  service: GatewayStatusNatsResponderService,
): ServiceInternals => service as unknown as ServiceInternals;

const createSubscription = (messages: Msg[]): Subscription =>
  ({
    unsubscribe: jest.fn(),
    [Symbol.asyncIterator](): AsyncIterator<Msg> {
      let index = 0;
      return {
        next: () =>
          Promise.resolve(
            index < messages.length
              ? { done: false, value: messages[index++] }
              : { done: true, value: undefined },
          ),
      };
    },
  }) as unknown as Subscription;

const createManagedSubscription = (
  messages: Msg[],
): { subscription: Subscription; unsubscribe: jest.Mock } => {
  const unsubscribe = jest.fn();
  return {
    unsubscribe,
    subscription: {
      unsubscribe,
      [Symbol.asyncIterator](): AsyncIterator<Msg> {
        let index = 0;
        return {
          next: () =>
            Promise.resolve(
              index < messages.length
                ? { done: false, value: messages[index++] }
                : { done: true, value: undefined },
            ),
        };
      },
    } as unknown as Subscription,
  };
};

describe('GatewayStatusNatsResponderService', () => {
  const codec = JSONCodec<unknown>();
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('skips initialization when MOCK_NATS is not false', async () => {
    process.env = { ...originalEnv, MOCK_NATS: 'true' };
    const service = new GatewayStatusNatsResponderService(
      {} as GatewaysService,
    );

    await service.onModuleInit();

    expect(getInternals(service).connection).toBeNull();
  });

  it('connects to NATS when MOCK_NATS is false', async () => {
    const { subscription } = createManagedSubscription([]);
    const connection: TestConnection = {
      publish: jest.fn(),
      subscribe: jest.fn().mockReturnValue(subscription),
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const connectMock = connect as jest.MockedFunction<typeof connect>;
    connectMock.mockResolvedValue(connection as NatsConnection);

    process.env = {
      ...originalEnv,
      MOCK_NATS: 'false',
      NATS_SERVERS: 'nats://localhost:4222',
    };

    const service = new GatewayStatusNatsResponderService(
      {} as GatewaysService,
    );
    await service.onModuleInit();

    expect(connectMock).toHaveBeenCalled();
    expect(connection.subscribe).toHaveBeenCalledWith(
      'internal.mgmt.gateway.update-status',
    );
  });

  it('returns success when gateway runtime status is updated', async () => {
    const updateGatewayRuntimeStatus = jest.fn().mockResolvedValue(true);
    const gatewaysService = {
      updateGatewayRuntimeStatus,
    } as unknown as GatewaysService;
    const service = new GatewayStatusNatsResponderService(gatewaysService);

    const response = await getInternals(service).handleUpdate({
      data: codec.encode({
        gateway_id: 'gateway-1',
        status: 'online',
        last_seen_at: '2026-04-08T10:00:00.000Z',
      }),
    } as Msg);

    expect(updateGatewayRuntimeStatus).toHaveBeenCalledWith(
      'gateway-1',
      GatewayStatus.GATEWAY_ONLINE,
      new Date('2026-04-08T10:00:00.000Z'),
    );
    expect(response).toEqual({ success: true });
  });

  it('returns not found when the gateway does not exist', async () => {
    const gatewaysService = {
      updateGatewayRuntimeStatus: jest.fn().mockResolvedValue(false),
    } as unknown as GatewaysService;
    const service = new GatewayStatusNatsResponderService(gatewaysService);

    await expect(
      getInternals(service).handleUpdate({
        data: codec.encode({
          gateway_id: 'gateway-404',
          status: 'offline',
          last_seen_at: '2026-04-08T10:00:00.000Z',
        }),
      } as unknown as Msg),
    ).resolves.toEqual({ success: false, error: 'NOT_FOUND' });
  });

  it('returns invalid payload for malformed requests', async () => {
    const service = new GatewayStatusNatsResponderService(
      {} as GatewaysService,
    );

    await expect(
      getInternals(service).handleUpdate({
        data: codec.encode({
          gateway_id: '',
          status: 'bad-status',
          last_seen_at: 'invalid',
        }),
      } as unknown as Msg),
    ).resolves.toEqual({ success: false, error: 'INVALID_PAYLOAD' });

    await expect(
      getInternals(service).handleUpdate({
        data: Buffer.from('invalid-json'),
      } as unknown as Msg),
    ).resolves.toEqual({ success: false, error: 'INVALID_PAYLOAD' });
  });

  it('publishes internal error when request handling throws', async () => {
    const publish = jest.fn();
    const gatewaysService = {
      updateGatewayRuntimeStatus: jest
        .fn()
        .mockRejectedValue(new Error('boom')),
    } as unknown as GatewaysService;
    const service = new GatewayStatusNatsResponderService(gatewaysService);
    getInternals(service).connection = {
      publish,
      subscribe: jest.fn(),
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    await getInternals(service).consumeRequests(
      createSubscription([
        {
          reply: 'reply.subject',
          data: codec.encode({
            gateway_id: 'gateway-1',
            status: 'online',
            last_seen_at: '2026-04-08T10:00:00.000Z',
          }),
        } as unknown as Msg,
      ]),
    );

    expect(publish).toHaveBeenCalledWith(
      'reply.subject',
      codec.encode({ success: false, error: 'INTERNAL' }),
    );
  });

  it('normalizes status aliases correctly', async () => {
    const updateGatewayRuntimeStatus = jest.fn().mockResolvedValue(true);
    const gatewaysService = {
      updateGatewayRuntimeStatus,
    } as unknown as GatewaysService;
    const service = new GatewayStatusNatsResponderService(gatewaysService);

    const cases = [
      { input: 'gateway_online', expected: GatewayStatus.GATEWAY_ONLINE },
      { input: 'offline', expected: GatewayStatus.GATEWAY_OFFLINE },
      { input: 'suspended', expected: GatewayStatus.GATEWAY_SUSPENDED },
    ];

    for (const testCase of cases) {
      await getInternals(service).handleUpdate({
        data: codec.encode({
          gateway_id: 'gateway-1',
          status: testCase.input,
          last_seen_at: '2026-04-08T10:00:00.000Z',
        }),
      } as Msg);

      expect(updateGatewayRuntimeStatus).toHaveBeenLastCalledWith(
        'gateway-1',
        testCase.expected,
        expect.any(Date),
      );
    }
  });

  it('skips requests without reply subjects', async () => {
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const publish = jest.fn();
    const service = new GatewayStatusNatsResponderService(
      {} as GatewaysService,
    );
    getInternals(service).logger = logger;
    getInternals(service).connection = {
      publish,
      subscribe: jest.fn(),
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    await getInternals(service).consumeRequests(
      createSubscription([{ reply: '' } as Msg]),
    );

    expect(logger.warn).toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it('cleans up on destroy', async () => {
    const { subscription, unsubscribe } = createManagedSubscription([]);
    const connection: TestConnection = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const service = new GatewayStatusNatsResponderService(
      {} as GatewaysService,
    );

    getInternals(service).subscription = subscription;
    getInternals(service).connection = connection;

    await service.onModuleDestroy();

    const drain = connection.drain as jest.Mock;
    const close = connection.close as jest.Mock;

    expect(unsubscribe).toHaveBeenCalled();
    expect(drain).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('resolves servers and auth options from env', () => {
    process.env = {
      ...originalEnv,
      NATS_SERVERS: 'nats://srv1:4222,nats://srv2:4222',
      NATS_TOKEN: 'secret-token',
      NATS_TLS_CA: '/ca.pem',
      NATS_TLS_CERT: '/cert.pem',
      NATS_TLS_KEY: '/key.pem',
    };
    const service = new GatewayStatusNatsResponderService(
      {} as GatewaysService,
    );

    expect(getInternals(service).resolveServers()).toEqual([
      'nats://srv1:4222',
      'nats://srv2:4222',
    ]);
    expect(
      getInternals(service).buildConnectionOptions(['nats://srv1:4222']),
    ).toEqual(
      expect.objectContaining({
        token: 'secret-token',
        tls: {
          caFile: '/ca.pem',
          certFile: '/cert.pem',
          keyFile: '/key.pem',
        },
      }),
    );
  });
});
