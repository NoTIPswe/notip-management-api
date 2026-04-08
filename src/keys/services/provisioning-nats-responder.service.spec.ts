import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  connect,
  ConnectionOptions,
  JSONCodec,
  Msg,
  NatsConnection,
  Subscription,
} from 'nats';
import { KeysService } from './keys.service';
import { ProvisioningNatsResponderService } from './provisioning-nats-responder.service';

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
type ValidateResponse =
  | { gateway_id: string; tenant_id: string }
  | { error: 'INVALID' | 'ALREADY_PROVISIONED' | 'INTERNAL' };
type CompleteResponse =
  | { success: true }
  | { success: false; error: 'NOT_FOUND' | 'INTERNAL' };
type ServiceInternals = {
  connection: TestConnection | null;
  subscriptions: Subscription[];
  logger: TestLogger;
  handleValidate(msg: Msg): Promise<ValidateResponse>;
  handleComplete(msg: Msg): Promise<CompleteResponse>;
  startResponder(
    subject: string,
    handler: (msg: Msg) => Promise<unknown>,
  ): void;
  internalErrorResponse(subject: string): unknown;
  resolveServers(): string[];
  buildConnectionOptions(servers: string[]): ConnectionOptions;
};

const getInternals = (
  service: ProvisioningNatsResponderService,
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

describe('ProvisioningNatsResponderService', () => {
  const codec = JSONCodec<unknown>();
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('skips initialization when MOCK_NATS is not false', async () => {
    process.env = { ...originalEnv, MOCK_NATS: 'true' };
    const service = new ProvisioningNatsResponderService({} as KeysService);

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

    const service = new ProvisioningNatsResponderService({} as KeysService);
    await service.onModuleInit();

    expect(connectMock).toHaveBeenCalled();
    expect(connection.subscribe).toHaveBeenCalledWith(
      'internal.mgmt.factory.validate',
    );
    expect(connection.subscribe).toHaveBeenCalledWith(
      'internal.mgmt.provisioning.complete',
    );
  });

  it('returns gateway identity when factory validation succeeds', async () => {
    const keysService = {
      validateFactoryKey: jest.fn().mockResolvedValue({
        gatewayId: 'gateway-1',
        tenantId: 'tenant-1',
      }),
    } as unknown as KeysService;
    const service = new ProvisioningNatsResponderService(keysService);

    await expect(
      getInternals(service).handleValidate({
        data: codec.encode({
          factory_id: 'factory-1',
          factory_key: 'key-1',
        }),
      } as unknown as Msg),
    ).resolves.toEqual({
      gateway_id: 'gateway-1',
      tenant_id: 'tenant-1',
    });
  });

  it('maps validation auth and conflict errors to protocol responses', async () => {
    const keysService = {
      validateFactoryKey: jest
        .fn()
        .mockRejectedValueOnce(new UnauthorizedException('INVALID'))
        .mockRejectedValueOnce(new ConflictException('ALREADY_PROVISIONED')),
    } as unknown as KeysService;
    const service = new ProvisioningNatsResponderService(keysService);

    await expect(
      getInternals(service).handleValidate({
        data: codec.encode({ factory_id: 'f1', factory_key: 'k1' }),
      } as unknown as Msg),
    ).resolves.toEqual({ error: 'INVALID' });

    await expect(
      getInternals(service).handleValidate({
        data: codec.encode({ factory_id: 'f1', factory_key: 'k1' }),
      } as unknown as Msg),
    ).resolves.toEqual({ error: 'ALREADY_PROVISIONED' });
  });

  it('returns internal for invalid validation payloads and unknown validation errors', async () => {
    const keysService = {
      validateFactoryKey: jest.fn().mockRejectedValue(new Error('unexpected')),
    } as unknown as KeysService;
    const service = new ProvisioningNatsResponderService(keysService);

    await expect(
      getInternals(service).handleValidate({
        data: Buffer.from('invalid-json'),
      } as unknown as Msg),
    ).resolves.toEqual({ error: 'INVALID' });

    await expect(
      getInternals(service).handleValidate({
        data: codec.encode({ factory_id: 'f1' }),
      } as unknown as Msg),
    ).resolves.toEqual({ error: 'INVALID' });

    await expect(
      getInternals(service).handleValidate({
        data: codec.encode({ factory_id: 'f1', factory_key: 'k1' }),
      } as unknown as Msg),
    ).resolves.toEqual({ error: 'INTERNAL' });
  });

  it('returns success when provisioning completes', async () => {
    const keysService = {
      completeProvisioning: jest.fn().mockResolvedValue(undefined),
    } as unknown as KeysService;
    const service = new ProvisioningNatsResponderService(keysService);

    await expect(
      getInternals(service).handleComplete({
        data: codec.encode({
          gateway_id: 'gateway-1',
          key_material: 'c2VjcmV0',
          key_version: 1,
          send_frequency_ms: 5000,
          firmware_version: '1.0.0',
        }),
      } as unknown as Msg),
    ).resolves.toEqual({ success: true });
  });

  it('maps completion not found and invalid payloads correctly', async () => {
    const keysService = {
      completeProvisioning: jest
        .fn()
        .mockRejectedValueOnce(new NotFoundException('Gateway not found'))
        .mockRejectedValueOnce(new Error('unexpected')),
    } as unknown as KeysService;
    const service = new ProvisioningNatsResponderService(keysService);

    await expect(
      getInternals(service).handleComplete({
        data: codec.encode({
          gateway_id: 'gateway-404',
          key_material: 'c2VjcmV0',
          key_version: 1,
          send_frequency_ms: 5000,
        }),
      } as unknown as Msg),
    ).resolves.toEqual({ success: false, error: 'NOT_FOUND' });

    await expect(
      getInternals(service).handleComplete({
        data: Buffer.from('invalid-json'),
      } as unknown as Msg),
    ).resolves.toEqual({ success: false, error: 'INTERNAL' });

    await expect(
      getInternals(service).handleComplete({
        data: codec.encode({
          gateway_id: '',
          key_material: '',
          key_version: 'x',
          send_frequency_ms: 0,
        }),
      } as Msg),
    ).resolves.toEqual({ success: false, error: 'INTERNAL' });

    await expect(
      getInternals(service).handleComplete({
        data: codec.encode({
          gateway_id: 'gateway-1',
          key_material: 'c2VjcmV0',
          key_version: 1,
          send_frequency_ms: 5000,
        }),
      } as Msg),
    ).resolves.toEqual({ success: false, error: 'INTERNAL' });
  });

  it('publishes responses and skips missing reply subjects', async () => {
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    let resolvePublished: (() => void) | undefined;
    const published = new Promise<void>((resolve) => {
      resolvePublished = resolve;
    });
    const publish = jest.fn(() => {
      resolvePublished?.();
    });
    const subscribe = jest
      .fn()
      .mockReturnValueOnce(
        createSubscription([
          {
            reply: 'reply.validate',
            data: codec.encode({ factory_id: 'f1', factory_key: 'k1' }),
          } as unknown as Msg,
        ]),
      )
      .mockReturnValueOnce(createSubscription([{ reply: '' } as Msg]));
    const keysService = {
      validateFactoryKey: jest.fn().mockResolvedValue({
        gatewayId: 'gateway-1',
        tenantId: 'tenant-1',
      }),
      completeProvisioning: jest.fn().mockResolvedValue(undefined),
    } as unknown as KeysService;
    const service = new ProvisioningNatsResponderService(keysService);
    getInternals(service).logger = logger;
    getInternals(service).connection = {
      publish,
      subscribe,
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    getInternals(service).startResponder(
      'internal.mgmt.factory.validate',
      (msg) => getInternals(service).handleValidate(msg),
    );
    getInternals(service).startResponder(
      'internal.mgmt.provisioning.complete',
      () => Promise.resolve({ success: true }),
    );

    await published;

    expect(publish).toHaveBeenCalledWith(
      'reply.validate',
      codec.encode({ gateway_id: 'gateway-1', tenant_id: 'tenant-1' }),
    );
    expect(logger.warn).toHaveBeenCalled();
    expect(getInternals(service).subscriptions).toHaveLength(2);
  });

  it('cleans up subscriptions and connection on destroy', async () => {
    const firstManaged = createManagedSubscription([]);
    const secondManaged = createManagedSubscription([]);
    const connection: TestConnection = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ProvisioningNatsResponderService({} as KeysService);

    getInternals(service).subscriptions.push(
      firstManaged.subscription,
      secondManaged.subscription,
    );
    getInternals(service).connection = connection;

    await service.onModuleDestroy();

    const drain = connection.drain as jest.Mock;
    const close = connection.close as jest.Mock;

    expect(firstManaged.unsubscribe).toHaveBeenCalled();
    expect(secondManaged.unsubscribe).toHaveBeenCalled();
    expect(drain).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(getInternals(service).subscriptions).toHaveLength(0);
  });

  it('resolves servers and auth options from env', () => {
    process.env = {
      ...originalEnv,
      NATS_SERVERS: 'nats://srv1:4222,nats://srv2:4222',
      NATS_USER: 'user',
      NATS_PASSWORD: 'pass',
      NATS_TLS_CA: '/ca.pem',
      NATS_TLS_CERT: '/cert.pem',
      NATS_TLS_KEY: '/key.pem',
    };
    const service = new ProvisioningNatsResponderService({} as KeysService);

    expect(getInternals(service).resolveServers()).toEqual([
      'nats://srv1:4222',
      'nats://srv2:4222',
    ]);
    expect(
      getInternals(service).buildConnectionOptions(['nats://srv1:4222']),
    ).toEqual(
      expect.objectContaining({
        user: 'user',
        pass: 'pass',
        tls: {
          caFile: '/ca.pem',
          certFile: '/cert.pem',
          keyFile: '/key.pem',
        },
      }),
    );
  });

  it('maps internal error responses by subject', () => {
    const service = new ProvisioningNatsResponderService({} as KeysService);

    expect(
      getInternals(service).internalErrorResponse(
        'internal.mgmt.factory.validate',
      ),
    ).toEqual({ error: 'INTERNAL' });
    expect(
      getInternals(service).internalErrorResponse(
        'internal.mgmt.provisioning.complete',
      ),
    ).toEqual({ success: false, error: 'INTERNAL' });
  });
});
