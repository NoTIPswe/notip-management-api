import { GatewaysNatsService } from './gateways.nats.service';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { JetStreamClient, NatsHandler } from '../../nats/jetstream.client';
import { GatewayStatus } from '../enums/gateway.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('GatewaysNatsService', () => {
  it('updates gateway status and responds with success', async () => {
    const handlers = new Map<string, NatsHandler>();
    const updateStatus = jest.fn().mockResolvedValue(true);
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findByIdUnscoped: jest.fn(),
      updateStatus,
      findByFactoryId: jest.fn(),
    } as unknown as GatewaysPersistenceService;

    const service = new GatewaysNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.gateway.update-status');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-1',
          status: GatewayStatus.GATEWAY_ONLINE,
          last_seen_at: '2026-01-01T00:00:00.000Z',
        }),
      ),
      subject: 'internal.mgmt.gateway.update-status',
      respond,
    });

    expect(updateStatus).toHaveBeenCalledWith(
      'gateway-1',
      GatewayStatus.GATEWAY_ONLINE,
      new Date('2026-01-01T00:00:00.000Z'),
    );
    expect(respond).toHaveBeenCalledWith(
      Buffer.from(JSON.stringify({ success: true })),
    );
  });

  it('responds with failure when gateway status update throws', async () => {
    const handlers = new Map<string, NatsHandler>();
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findByIdUnscoped: jest.fn(),
      updateStatus: jest.fn().mockRejectedValue(new Error('update failed')),
      findByFactoryId: jest.fn(),
    } as unknown as GatewaysPersistenceService;

    const service = new GatewaysNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.gateway.update-status');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-1',
          status: GatewayStatus.GATEWAY_OFFLINE,
          last_seen_at: '2026-01-01T00:00:00.000Z',
        }),
      ),
      subject: 'internal.mgmt.gateway.update-status',
      respond,
    });

    expect(respond).toHaveBeenCalledWith(
      Buffer.from(
        JSON.stringify({
          success: false,
          error: 'update failed',
        }),
      ),
    );
  });

  it('responds with gateway identity when factory validation succeeds', async () => {
    const handlers = new Map<string, NatsHandler>();
    const findByFactoryId = jest.fn().mockResolvedValue({
      id: 'gateway-1',
      tenantId: 'tenant-1',
      factoryKeyHash: 'hash',
      provisioned: false,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findByIdUnscoped: jest.fn(),
      updateStatus: jest.fn(),
      findByFactoryId,
    } as unknown as GatewaysPersistenceService;

    const service = new GatewaysNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.factory.validate');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          factory_id: 'factory-1',
          factory_key: 'plain-key',
        }),
      ),
      subject: 'internal.mgmt.factory.validate',
      respond,
    });

    expect(findByFactoryId).toHaveBeenCalledWith('factory-1');
    expect(bcrypt.compare).toHaveBeenCalledWith('plain-key', 'hash');
    expect(respond).toHaveBeenCalledWith(
      Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-1',
          tenant_id: 'tenant-1',
        }),
      ),
    );
  });

  it('responds invalid when factory validation fails', async () => {
    const handlers = new Map<string, NatsHandler>();
    const findByFactoryId = jest.fn().mockResolvedValue({
      id: 'gateway-1',
      tenantId: 'tenant-1',
      factoryKeyHash: 'hash',
      provisioned: false,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findByIdUnscoped: jest.fn(),
      updateStatus: jest.fn(),
      findByFactoryId,
    } as unknown as GatewaysPersistenceService;

    const service = new GatewaysNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.factory.validate');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          factory_id: 'factory-1',
          factory_key: 'wrong-key',
        }),
      ),
      subject: 'internal.mgmt.factory.validate',
      respond,
    });

    expect(respond).toHaveBeenCalledWith(
      Buffer.from(JSON.stringify({ error: 'INVALID' })),
    );
  });

  it('responds invalid when factory validation finds no eligible gateway', async () => {
    const handlers = new Map<string, NatsHandler>();
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findByIdUnscoped: jest.fn(),
      updateStatus: jest.fn(),
      findByFactoryId: jest.fn().mockResolvedValue(null),
    } as unknown as GatewaysPersistenceService;

    const service = new GatewaysNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.factory.validate');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          factory_id: 'factory-1',
          factory_key: 'plain-key',
        }),
      ),
      subject: 'internal.mgmt.factory.validate',
      respond,
    });

    expect(respond).toHaveBeenCalledWith(
      Buffer.from(JSON.stringify({ error: 'INVALID' })),
    );
  });

  it('responds with internal error when factory validation throws', async () => {
    const handlers = new Map<string, NatsHandler>();
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findByIdUnscoped: jest.fn(),
      updateStatus: jest.fn(),
      findByFactoryId: jest.fn().mockRejectedValue(new Error('lookup failed')),
    } as unknown as GatewaysPersistenceService;

    const service = new GatewaysNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.factory.validate');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          factory_id: 'factory-1',
          factory_key: 'plain-key',
        }),
      ),
      subject: 'internal.mgmt.factory.validate',
      respond,
    });

    expect(respond).toHaveBeenCalledWith(
      Buffer.from(
        JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'lookup failed',
        }),
      ),
    );
  });

  it('registers the gateway lifecycle responder and maps suspended to paused', async () => {
    const handlers = new Map<string, NatsHandler>();
    const findByIdUnscoped = jest.fn().mockResolvedValue({
      id: 'gateway-1',
      metadata: { status: GatewayStatus.GATEWAY_SUSPENDED },
    });
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findByIdUnscoped,
      updateStatus: jest.fn(),
      findByFactoryId: jest.fn(),
    } as unknown as GatewaysPersistenceService;

    const service = new GatewaysNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.gateway.get-status');
    const respond = jest.fn();

    expect(handler).toBeDefined();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-1',
          tenant_id: 'tenant-1',
        }),
      ),
      subject: 'internal.mgmt.gateway.get-status',
      respond,
    });

    expect(findByIdUnscoped).toHaveBeenCalledWith('gateway-1');
    expect(respond).toHaveBeenCalledWith(
      Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-1',
          state: 'paused',
        }),
      ),
    );
  });

  it('defaults missing gateways to offline for the lifecycle responder', async () => {
    const handlers = new Map<string, NatsHandler>();
    const findByIdUnscoped = jest.fn().mockResolvedValue(null);
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findByIdUnscoped,
      updateStatus: jest.fn(),
      findByFactoryId: jest.fn(),
    } as unknown as GatewaysPersistenceService;

    const service = new GatewaysNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.gateway.get-status');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gateway_id: 'missing-gateway',
          tenant_id: 'tenant-1',
        }),
      ),
      subject: 'internal.mgmt.gateway.get-status',
      respond,
    });

    expect(respond).toHaveBeenCalledWith(
      Buffer.from(
        JSON.stringify({
          gateway_id: 'missing-gateway',
          state: 'offline',
        }),
      ),
    );
  });

  it('maps gateway online and provisioning lifecycle states from metadata', async () => {
    const handlers = new Map<string, NatsHandler>();
    const findByIdUnscoped = jest
      .fn()
      .mockResolvedValueOnce({
        id: 'gateway-1',
        metadata: { status: GatewayStatus.GATEWAY_ONLINE },
      })
      .mockResolvedValueOnce({
        id: 'gateway-2',
        metadata: { status: GatewayStatus.GATEWAYS_PROVISIONING },
      });
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findByIdUnscoped,
      updateStatus: jest.fn(),
      findByFactoryId: jest.fn(),
    } as unknown as GatewaysPersistenceService;

    const service = new GatewaysNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.gateway.get-status');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-1',
          tenant_id: 'tenant-1',
        }),
      ),
      subject: 'internal.mgmt.gateway.get-status',
      respond,
    });

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-2',
          tenant_id: 'tenant-1',
        }),
      ),
      subject: 'internal.mgmt.gateway.get-status',
      respond,
    });

    expect(respond).toHaveBeenNthCalledWith(
      1,
      Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-1',
          state: 'online',
        }),
      ),
    );
    expect(respond).toHaveBeenNthCalledWith(
      2,
      Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-2',
          state: 'provisioning',
        }),
      ),
    );
  });

  it('responds with internal error when lifecycle lookup throws', async () => {
    const handlers = new Map<string, NatsHandler>();
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findByIdUnscoped: jest.fn().mockRejectedValue(new Error('lookup failed')),
      updateStatus: jest.fn(),
      findByFactoryId: jest.fn(),
    } as unknown as GatewaysPersistenceService;

    const service = new GatewaysNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.gateway.get-status');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-1',
          tenant_id: 'tenant-1',
        }),
      ),
      subject: 'internal.mgmt.gateway.get-status',
      respond,
    });

    expect(respond).toHaveBeenCalledWith(
      Buffer.from(
        JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'lookup failed',
        }),
      ),
    );
  });
});
