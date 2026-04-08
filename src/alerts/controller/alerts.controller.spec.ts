import { AlertsController } from './alerts.controller';
import { AlertsService } from '../services/alerts.service';
import { AlertType } from '../enums/alerts.enum';

describe('AlertsController', () => {
  it('returns mapped alerts', async () => {
    const lastSeen = new Date('2024-01-01T00:00:00.000Z');
    const service = {
      getAlerts: jest.fn().mockResolvedValue([
        {
          id: 'alert-1',
          gatewayId: 'gateway-1',
          type: AlertType.GATEWAY_OFFLINE,
          details: {
            lastSeen,
            timeoutConfigured: 60000,
          },
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
    const defaultUpdatedAt = new Date('2024-01-01T00:00:00.000Z');
    const overrideUpdatedAt = new Date('2024-01-01T01:00:00.000Z');

    const service = {
      getAlertsConfig: jest.fn().mockResolvedValue({
        defaultTimeoutMs: 60000,
        defaultUpdatedAt,
        gatewayOverrides: [
          {
            gatewayId: 'gateway-1',
            gatewayTimeoutMs: 30000,
            updatedAt: overrideUpdatedAt,
          },
        ],
      }),
    } as unknown as AlertsService;
    const controller = new AlertsController(service);

    await expect(controller.getAlertsConfig('tenant-1')).resolves.toEqual({
      defaultTimeoutMs: 60000,
      defaultUpdatedAt: defaultUpdatedAt.toISOString(),
      gatewayOverrides: [
        {
          gatewayId: 'gateway-1',
          timeoutMs: 30000,
          updatedAt: overrideUpdatedAt.toISOString(),
        },
      ],
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
      defaultUpdatedAt: updatedAt.toISOString(),
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
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('deletes gateway alerts config without returning a body', async () => {
    const deleteGatewayAlertsConfigMock = jest
      .fn()
      .mockResolvedValue(undefined);
    const service = {
      deleteGatewayAlertsConfig: deleteGatewayAlertsConfigMock,
    } as unknown as AlertsService;
    const controller = new AlertsController(service);

    await expect(
      controller.deleteGatewayAlertsConfig('tenant-1', 'gateway-1'),
    ).resolves.toBeUndefined();
    expect(deleteGatewayAlertsConfigMock).toHaveBeenCalledWith(
      'tenant-1',
      'gateway-1',
    );
  });
});
