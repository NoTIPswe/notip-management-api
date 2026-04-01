import { AlertsNatsService } from './alerts.nats.service';
import { AlertsPersistenceService } from './alerts.persistence.service';
import {
  JetStreamClient,
  JetStreamHandler,
  NatsHandler,
} from '../../nats/jetstream.client';
import { AlertType } from '../enums/alerts.enum';

describe('AlertsNatsService', () => {
  it('responds with alert configs over core NATS request-reply', async () => {
    const coreHandlers = new Map<string, NatsHandler>();
    const streamHandlers = new Map<string, JetStreamHandler>();
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        coreHandlers.set(subject, handler);
      }),
      subscribe: jest.fn((subject: string, handler: JetStreamHandler) => {
        streamHandlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findAllAlertsConfigs: jest.fn().mockResolvedValue([
        {
          tenantId: 'tenant-1',
          gatewayId: 'gateway-1',
          gatewayTimeoutMs: 30000,
        },
      ]),
      saveAlert: jest.fn(),
    } as unknown as AlertsPersistenceService;

    const service = new AlertsNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = coreHandlers.get('internal.mgmt.alert-configs.list');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from('{}'),
      subject: 'internal.mgmt.alert-configs.list',
      respond,
    });

    expect(respond).toHaveBeenCalledWith(
      Buffer.from(
        JSON.stringify([
          {
            tenant_id: 'tenant-1',
            gateway_id: 'gateway-1',
            timeout_ms: 30000,
          },
        ]),
      ),
    );
    expect(streamHandlers.has('alert.*.gw_offline')).toBe(true);
  });

  it('responds with an internal error when alert config listing fails', async () => {
    const coreHandlers = new Map<string, NatsHandler>();
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        coreHandlers.set(subject, handler);
      }),
      subscribe: jest.fn(),
    } as unknown as JetStreamClient;
    const persistence = {
      findAllAlertsConfigs: jest
        .fn()
        .mockRejectedValue(new Error('db unavailable')),
      saveAlert: jest.fn(),
    } as unknown as AlertsPersistenceService;

    const service = new AlertsNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = coreHandlers.get('internal.mgmt.alert-configs.list');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from('{}'),
      subject: 'internal.mgmt.alert-configs.list',
      respond,
    });

    expect(respond).toHaveBeenCalledWith(
      Buffer.from(
        JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'db unavailable',
        }),
      ),
    );
  });

  it('persists gateway offline alerts and acknowledges the message', async () => {
    const streamHandlers = new Map<string, JetStreamHandler>();
    const ack = jest.fn();
    const saveAlert = jest.fn().mockResolvedValue(undefined);
    const nats = {
      subscribeCore: jest.fn(),
      subscribe: jest.fn((subject: string, handler: JetStreamHandler) => {
        streamHandlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findAllAlertsConfigs: jest.fn(),
      saveAlert,
    } as unknown as AlertsPersistenceService;

    const service = new AlertsNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = streamHandlers.get('alert.*.gw_offline');

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gatewayId: 'gateway-1',
          lastSeen: '2026-01-01T00:00:00.000Z',
          timeoutMs: 30000,
          timestamp: '2026-01-01T00:01:00.000Z',
        }),
      ),
      subject: 'alert.tenant-1.gw_offline',
      ack,
    });

    expect(saveAlert).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      type: AlertType.GATEWAY_OFFLINE,
      details: {
        lastSeen: new Date('2026-01-01T00:00:00.000Z'),
        timeoutConfigured: 30000,
        timestamp: '2026-01-01T00:01:00.000Z',
      },
    });
    expect(ack).toHaveBeenCalled();
  });

  it('skips alert persistence when tenant id cannot be determined', async () => {
    const streamHandlers = new Map<string, JetStreamHandler>();
    const saveAlert = jest.fn();
    const ack = jest.fn();
    const nats = {
      subscribeCore: jest.fn(),
      subscribe: jest.fn((subject: string, handler: JetStreamHandler) => {
        streamHandlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findAllAlertsConfigs: jest.fn(),
      saveAlert,
    } as unknown as AlertsPersistenceService;

    const service = new AlertsNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = streamHandlers.get('alert.*.gw_offline');

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gatewayId: 'gateway-1',
          tenantId: '',
          lastSeen: '2026-01-01T00:00:00.000Z',
          timeoutMs: 30000,
          timestamp: '2026-01-01T00:01:00.000Z',
        }),
      ),
      subject: 'alert',
      ack,
    });

    expect(saveAlert).not.toHaveBeenCalled();
    expect(ack).not.toHaveBeenCalled();
  });

  it('swallows parsing errors for gateway offline alerts', async () => {
    const streamHandlers = new Map<string, JetStreamHandler>();
    const saveAlert = jest.fn();
    const ack = jest.fn();
    const nats = {
      subscribeCore: jest.fn(),
      subscribe: jest.fn((subject: string, handler: JetStreamHandler) => {
        streamHandlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const persistence = {
      findAllAlertsConfigs: jest.fn(),
      saveAlert,
    } as unknown as AlertsPersistenceService;

    const service = new AlertsNatsService(nats, persistence);

    await service.onModuleInit();

    const handler = streamHandlers.get('alert.*.gw_offline');

    await expect(
      handler?.({
        data: Buffer.from('not-json'),
        subject: 'alert.tenant-1.gw_offline',
        ack,
      }),
    ).resolves.toBeUndefined();

    expect(saveAlert).not.toHaveBeenCalled();
    expect(ack).not.toHaveBeenCalled();
  });
});
