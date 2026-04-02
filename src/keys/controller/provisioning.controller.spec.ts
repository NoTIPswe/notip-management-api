import { ProvisioningController } from './provisioning.controller';
import { KeysService } from '../services/keys.service';

describe('ProvisioningController', () => {
  it('validates a factory key and maps the response', async () => {
    const validateFactoryKeyMock = jest.fn().mockResolvedValue({
      gatewayId: 'gateway-1',
      tenantId: 'tenant-1',
    });
    const service = {
      validateFactoryKey: validateFactoryKeyMock,
    } as unknown as KeysService;
    const controller = new ProvisioningController(service);

    await expect(
      controller.validate({
        factory_id: 'factory-1',
        factory_key: 'secret-1',
      }),
    ).resolves.toEqual({
      gateway_id: 'gateway-1',
      tenant_id: 'tenant-1',
    });
    expect(validateFactoryKeyMock).toHaveBeenCalledWith(
      'factory-1',
      'secret-1',
    );
  });
});
