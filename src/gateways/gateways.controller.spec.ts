import { GatewaysController } from './gateways.controller';
import { GatewaysService } from './gateways.service';

const model = {
  id: 'gateway-1',
  name: 'Gateway A',
  status: 'online',
  lastSeenAt: new Date('2024-01-01T00:00:00.000Z'),
  sendFrequencyMs: 30000,
  factoryKey: 'factory-key',
  factoryId: 'factory-id',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  firmwareVersion: '1.0.0',
  model: 'nx-1',
  tenantId: 'tenant-1',
  provisioned: true,
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
};

describe('GatewaysController', () => {
  it('returns mapped gateways', async () => {
    const service = {
      getGateways: jest.fn().mockResolvedValue([model]),
    } as unknown as GatewaysService;
    const controller = new GatewaysController(service);

    await expect(controller.getGateways('tenant-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'gateway-1',
        name: 'Gateway A',
        status: 'online',
      }),
    ]);
  });

  it('returns a mapped gateway by id', async () => {
    const service = {
      findById: jest.fn().mockResolvedValue(model),
    } as unknown as GatewaysService;
    const controller = new GatewaysController(service);

    await expect(
      controller.getGatewayById('tenant-1', 'gateway-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'gateway-1',
        name: 'Gateway A',
      }),
    );
  });

  it('updates a gateway and maps the response', async () => {
    const service = {
      updateGateway: jest.fn().mockResolvedValue(model),
    } as unknown as GatewaysService;
    const controller = new GatewaysController(service);

    await expect(
      controller.updateGateway('tenant-1', 'gateway-1', { name: 'Gateway A' }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'gateway-1',
        name: 'Gateway A',
      }),
    );
  });

  it('deletes a gateway and returns the expected message', async () => {
    const service = {
      deleteGateway: jest.fn().mockResolvedValue(undefined),
    } as unknown as GatewaysService;
    const controller = new GatewaysController(service);

    await expect(
      controller.deleteGateway('tenant-1', 'gateway-1'),
    ).resolves.toEqual({ message: 'decommissioned' });
  });
});
