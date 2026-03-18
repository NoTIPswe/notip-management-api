import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertType } from './enums/alerts.enum';

describe('AlertsController', () => {
  it('returns mapped alerts', async () => {
    const service = {
      getAlerts: jest.fn().mockResolvedValue([
        {
          id: 'alert-1',
          gatewayId: 'gateway-1',
          type: AlertType.GATEWAY_OFFLINE,
          details: { message: 'offline' },
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ]),
    } as unknown as AlertsService;
    const controller = new AlertsController(service);

    await expect(
      controller.getAlerts(
        'tenant-1',
        '2024-01-01T00:00:00.000Z',
        '2024-01-02T00:00:00.000Z',
        'gateway-1',
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'alert-1',
        gatewayId: 'gateway-1',
      }),
    ]);
  });

  it('returns mapped alerts config', async () => {
    const service = {
      getAlertsConfig: jest.fn().mockResolvedValue({
        defaultTimeoutMs: 60000,
        gatewayOverrides: [{ gatewayId: 'gateway-1', gatewayTimeoutMs: 30000 }],
      }),
    } as unknown as AlertsService;
    const controller = new AlertsController(service);

    await expect(controller.getAlertsConfig('tenant-1')).resolves.toEqual({
      defaultTimeoutMs: 60000,
      gatewayOverrides: [{ gatewayId: 'gateway-1', timeoutMs: 30000 }],
    });
  });

  it('sets default alerts config and maps the response', async () => {
    const updatedAt = new Date('2024-01-01T00:00:00.000Z');
    const service = {
      setDefaultAlertsConfig: jest.fn().mockResolvedValue({
        tenantId: 'tenant-1',
        gatewayTimeoutMs: 60000,
        updatedAt,
      }),
    } as unknown as AlertsService;
    const controller = new AlertsController(service);

    await expect(
      controller.setDefaultAlertsConfig('tenant-1', {
        tenantUnreachableTimeoutMs: 60000,
      }),
    ).resolves.toEqual({
      tenantId: 'tenant-1',
      defaultTimeoutMs: 60000,
      updatedAt,
    });
  });

  it('sets gateway alerts config and maps the response', async () => {
    const updatedAt = new Date('2024-01-01T00:00:00.000Z');
    const service = {
      setGatewayAlertsConfig: jest.fn().mockResolvedValue({
        gatewayId: 'gateway-1',
        gatewayTimeoutMs: 30000,
        updatedAt,
      }),
    } as unknown as AlertsService;
    const controller = new AlertsController(service);

    await expect(
      controller.setGatewayAlertsConfig('tenant-1', 'gateway-1', {
        gatewayUnreachableTimeoutMs: 30000,
      }),
    ).resolves.toEqual({
      gatewayId: 'gateway-1',
      timeoutMs: 30000,
      updatedAt,
    });
  });
});
