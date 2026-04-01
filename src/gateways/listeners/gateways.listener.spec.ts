import { GatewaysListener } from './gateways.listener';
import { JetStreamClient } from '../../nats/jetstream.client';

describe('GatewaysListener', () => {
  it('publishes a decommissioning event to NATS', async () => {
    const publish = jest.fn().mockResolvedValue(undefined);
    const nats = { publish } as unknown as JetStreamClient;
    const listener = new GatewaysListener(nats);

    await listener.handleGatewayDecommissioned({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
    });

    expect(publish).toHaveBeenCalledTimes(1);
    const [subject, payload] = publish.mock.calls[0] as [string, Buffer];

    expect(subject).toBe('gateway.decommissioned.tenant-1.gateway-1');
    expect(JSON.parse(String(payload))).toMatchObject({
      gatewayId: 'gateway-1',
    });
  });

  it('swallows publish errors when decommission event emission fails', async () => {
    const publish = jest.fn().mockRejectedValue(new Error('nats down'));
    const nats = { publish } as unknown as JetStreamClient;
    const listener = new GatewaysListener(nats);

    await expect(
      listener.handleGatewayDecommissioned({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
      }),
    ).resolves.toBeUndefined();

    expect(publish).toHaveBeenCalled();
  });
});
