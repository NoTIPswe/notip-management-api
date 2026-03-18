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
});
