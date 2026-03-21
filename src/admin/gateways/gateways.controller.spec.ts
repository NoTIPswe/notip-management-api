import { GatewaysController } from './gateways.controller';
import { GatewaysService } from './gateways.service';

describe('AdminGatewaysController', () => {
  it('delegates gateway listing to the service', async () => {
    const getGatewaysMock = jest.fn().mockResolvedValue([{ id: 'gateway-1' }]);
    const service = {
      getGateways: getGatewaysMock,
    } as unknown as GatewaysService;
    const controller = new GatewaysController(service);

    await expect(controller.getGateways('tenant-1')).resolves.toEqual([
      { id: 'gateway-1' },
    ]);
    expect(getGatewaysMock).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
  });

  it('maps add gateway input and delegates creation', async () => {
    const addGatewayMock = jest.fn().mockResolvedValue({ id: 'gateway-1' });
    const service = {
      addGateway: addGatewayMock,
    } as unknown as GatewaysService;
    const controller = new GatewaysController(service);

    await expect(
      controller.addGateway({
        tenantId: 'tenant-1',
        factoryId: 'factory-1',
        factoryKeyHash: 'factory-key-hash',
      }),
    ).resolves.toEqual({ id: 'gateway-1' });
    expect(addGatewayMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      factoryId: 'factory-1',
      factoryKeyHash: 'factory-key-hash',
    });
  });

  it('maps snake_case add gateway input and delegates creation', async () => {
    const addGatewayMock = jest.fn().mockResolvedValue({ id: 'gateway-1' });
    const service = {
      addGateway: addGatewayMock,
    } as unknown as GatewaysService;
    const controller = new GatewaysController(service);

    await expect(
      controller.addGateway({
        tenant_id: 'tenant-1',
        factory_id: 'factory-1',
        factory_key_hash: 'factory-key-hash',
      } as unknown as never),
    ).resolves.toEqual({ id: 'gateway-1' });

    expect(addGatewayMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      factoryId: 'factory-1',
      factoryKeyHash: 'factory-key-hash',
    });
  });
});
