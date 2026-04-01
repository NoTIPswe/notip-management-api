import { KeysNatsService } from './keys.nats.service';
import { KeysService } from './keys.service';
import { JetStreamClient, NatsHandler } from '../../nats/jetstream.client';

describe('KeysNatsService', () => {
  it('completes provisioning and responds with success', async () => {
    const handlers = new Map<string, NatsHandler>();
    const completeProvisioning = jest.fn().mockResolvedValue(undefined);
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const keysService = {
      completeProvisioning,
    } as unknown as KeysService;

    const service = new KeysNatsService(nats, keysService);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.provisioning.complete');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-1',
          key_material: 'base64-key',
          key_version: 1,
        }),
      ),
      subject: 'internal.mgmt.provisioning.complete',
      respond,
    });

    expect(completeProvisioning).toHaveBeenCalledWith(
      'gateway-1',
      'base64-key',
      1,
      60000,
    );
    expect(respond).toHaveBeenCalledWith(
      Buffer.from(JSON.stringify({ success: true })),
    );
  });

  it('responds with failure when provisioning completion throws', async () => {
    const handlers = new Map<string, NatsHandler>();
    const nats = {
      subscribeCore: jest.fn((subject: string, handler: NatsHandler) => {
        handlers.set(subject, handler);
      }),
    } as unknown as JetStreamClient;
    const keysService = {
      completeProvisioning: jest
        .fn()
        .mockRejectedValue(new Error('persistence failed')),
    } as unknown as KeysService;

    const service = new KeysNatsService(nats, keysService);

    await service.onModuleInit();

    const handler = handlers.get('internal.mgmt.provisioning.complete');
    const respond = jest.fn();

    await handler?.({
      data: Buffer.from(
        JSON.stringify({
          gateway_id: 'gateway-1',
          key_material: 'base64-key',
          key_version: 1,
        }),
      ),
      subject: 'internal.mgmt.provisioning.complete',
      respond,
    });

    expect(respond).toHaveBeenCalledWith(
      Buffer.from(
        JSON.stringify({
          success: false,
          error: 'persistence failed',
        }),
      ),
    );
  });
});
