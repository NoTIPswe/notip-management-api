import {
  connect,
  ConnectionOptions,
  JSONCodec,
  Msg,
  NatsConnection,
  Subscription,
} from 'nats';
import { AlertConfigNatsResponderService } from './alert-config-nats-responder.service';
import { AlertsPersistenceService } from './alerts.persistence.service';

jest.mock('nats', () => {
  const actual = jest.requireActual<typeof import('nats')>('nats');
  return {
    ...actual,
    connect: jest.fn(),
  };
});

type AlertConfigResponse = {
  tenant_id: string;
  gateway_id?: string;
  timeout_ms: number;
};

type TestConnection = Pick<
  NatsConnection,
  'publish' | 'subscribe' | 'drain' | 'close'
>;
type TestLogger = Pick<Console, 'log' | 'warn' | 'error'>;
type ServiceInternals = {
  connection: TestConnection | null;
  subscription: Subscription | null;
  logger: TestLogger;
  consumeRequests(subscription: Subscription): Promise<void>;
  resolveServers(): string[];
  buildConnectionOptions(servers: string[]): ConnectionOptions;
};

const getInternals = (
  service: AlertConfigNatsResponderService,
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

describe('AlertConfigNatsResponderService', () => {
  const codec = JSONCodec<unknown>();
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('skips initialization when MOCK_NATS is not false', async () => {
    process.env = { ...originalEnv, MOCK_NATS: 'true' };
    const service = new AlertConfigNatsResponderService(
      {} as AlertsPersistenceService,
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

    const service = new AlertConfigNatsResponderService(
      {} as AlertsPersistenceService,
    );
    await service.onModuleInit();

    expect(connectMock).toHaveBeenCalled();
    expect(connection.subscribe).toHaveBeenCalledWith(
      'internal.mgmt.alert-configs.list',
    );
  });

  it('publishes alert configs on request', async () => {
    const publish = jest.fn();
    const persistence = {
      findAllAlertConfigs: jest.fn().mockResolvedValue([
        {
          tenantId: 'tenant-1',
          gatewayId: 'gateway-1',
          gatewayTimeoutMs: 60000,
        },
        {
          tenantId: 'tenant-2',
          gatewayId: null,
          gatewayTimeoutMs: 120000,
        },
      ]),
    } as unknown as AlertsPersistenceService;

    const service = new AlertConfigNatsResponderService(persistence);
    getInternals(service).connection = {
      publish,
      subscribe: jest.fn(),
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    await getInternals(service).consumeRequests(
      createSubscription([{ reply: 'reply.subject' } as Msg]),
    );

    expect(publish).toHaveBeenCalledWith(
      'reply.subject',
      codec.encode([
        {
          tenant_id: 'tenant-1',
          gateway_id: 'gateway-1',
          timeout_ms: 60000,
        } satisfies AlertConfigResponse,
        {
          tenant_id: 'tenant-2',
          timeout_ms: 120000,
        } satisfies AlertConfigResponse,
      ]),
    );
  });

  it('publishes an empty response when fetching alert configs fails', async () => {
    const publish = jest.fn();
    const persistence = {
      findAllAlertConfigs: jest.fn().mockRejectedValue(new Error('db down')),
    } as unknown as AlertsPersistenceService;
    const service = new AlertConfigNatsResponderService(persistence);
    getInternals(service).connection = {
      publish,
      subscribe: jest.fn(),
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    await getInternals(service).consumeRequests(
      createSubscription([{ reply: 'reply.subject' } as Msg]),
    );

    expect(publish).toHaveBeenCalledWith('reply.subject', codec.encode([]));
  });

  it('unsubscribes and closes the connection on destroy', async () => {
    const { subscription, unsubscribe } = createManagedSubscription([]);
    const connection: TestConnection = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AlertConfigNatsResponderService(
      {} as AlertsPersistenceService,
    );

    getInternals(service).subscription = subscription;
    getInternals(service).connection = connection;

    await service.onModuleDestroy();

    const drain = connection.drain as jest.Mock;
    const close = connection.close as jest.Mock;

    expect(unsubscribe).toHaveBeenCalled();
    expect(drain).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(getInternals(service).subscription).toBeNull();
    expect(getInternals(service).connection).toBeNull();
  });

  it('skips messages without reply subject', async () => {
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const publish = jest.fn();
    const persistence = {
      findAllAlertConfigs: jest.fn().mockResolvedValue([]),
    } as unknown as AlertsPersistenceService;
    const service = new AlertConfigNatsResponderService(persistence);
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

  it('uses default NATS servers when env vars are not set', () => {
    process.env = {
      ...originalEnv,
      NATS_SERVERS: undefined,
      NATS_URL: undefined,
    };
    const service = new AlertConfigNatsResponderService(
      {} as AlertsPersistenceService,
    );

    expect(getInternals(service).resolveServers()).toEqual([
      'nats://localhost:4222',
    ]);
  });

  it('uses NATS_URL fallback when NATS_SERVERS is not set', () => {
    process.env = {
      ...originalEnv,
      NATS_SERVERS: undefined,
      NATS_URL: 'nats://backup:4222',
    };
    const service = new AlertConfigNatsResponderService(
      {} as AlertsPersistenceService,
    );

    expect(getInternals(service).resolveServers()).toEqual([
      'nats://backup:4222',
    ]);
  });

  it('parses comma-separated NATS servers', () => {
    process.env = {
      ...originalEnv,
      NATS_SERVERS: 'nats://srv1:4222,nats://srv2:4222',
    };
    const service = new AlertConfigNatsResponderService(
      {} as AlertsPersistenceService,
    );

    expect(getInternals(service).resolveServers()).toEqual([
      'nats://srv1:4222',
      'nats://srv2:4222',
    ]);
  });

  it('builds connection options with token auth', () => {
    process.env = {
      ...originalEnv,
      NATS_TOKEN: 'secret-token',
      NATS_USER: undefined,
      NATS_PASSWORD: undefined,
    };
    const service = new AlertConfigNatsResponderService(
      {} as AlertsPersistenceService,
    );

    expect(
      getInternals(service).buildConnectionOptions(['nats://localhost:4222']),
    ).toEqual(
      expect.objectContaining({
        token: 'secret-token',
      }),
    );
  });

  it('builds connection options with user and password auth', () => {
    process.env = {
      ...originalEnv,
      NATS_TOKEN: undefined,
      NATS_USER: 'user',
      NATS_PASSWORD: 'pass',
    };
    const service = new AlertConfigNatsResponderService(
      {} as AlertsPersistenceService,
    );

    expect(
      getInternals(service).buildConnectionOptions(['nats://localhost:4222']),
    ).toEqual(
      expect.objectContaining({
        user: 'user',
        pass: 'pass',
      }),
    );
  });

  it('adds mTLS settings when tls env vars are present', () => {
    process.env = {
      ...originalEnv,
      NATS_TLS_CA: '/ca.pem',
      NATS_TLS_CERT: '/cert.pem',
      NATS_TLS_KEY: '/key.pem',
    };
    const service = new AlertConfigNatsResponderService(
      {} as AlertsPersistenceService,
    );

    expect(
      getInternals(service).buildConnectionOptions(['nats://localhost:4222']),
    ).toEqual(
      expect.objectContaining({
        tls: {
          caFile: '/ca.pem',
          certFile: '/cert.pem',
          keyFile: '/key.pem',
        },
      }),
    );
  });
});
