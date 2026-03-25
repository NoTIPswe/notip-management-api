import { Between, IsNull } from 'typeorm';
import { AlertsPersistenceService } from './alerts.persistence.service';

describe('AlertsPersistenceService', () => {
  it('upserts and returns gateway-specific config', async () => {
    const alertsRepo = {};
    const configRepo = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue({ id: 'config-1' }),
    };
    const service = new AlertsPersistenceService(
      alertsRepo as never,
      configRepo as never,
    );

    await expect(
      service.setGatewayAlertsConfig({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        gatewayTimeoutMs: 30000,
      }),
    ).resolves.toEqual({ id: 'config-1' });
    expect(configRepo.upsert).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        gatewayTimeoutMs: 30000,
      },
      ['tenantId', 'gatewayId'],
    );
  });

  it('upserts and returns default config', async () => {
    const alertsRepo = {};
    const configRepo = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue({ id: 'config-1' }),
    };
    const service = new AlertsPersistenceService(
      alertsRepo as never,
      configRepo as never,
    );

    await expect(
      service.setDefaultAlertsConfig({
        tenantId: 'tenant-1',
        defaultTimeoutMs: 60000,
      }),
    ).resolves.toEqual({ id: 'config-1' });
    expect(configRepo.upsert).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        gatewayId: null,
        gatewayTimeoutMs: 60000,
      },
      ['tenantId', 'gatewayId'],
    );
    expect(configRepo.findOne).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', gatewayId: IsNull() },
    });
  });

  it('returns alert config with gateway relations', async () => {
    const alertsRepo = {};
    const configRepo = {
      find: jest.fn().mockResolvedValue([{ id: 'config-1' }]),
    };
    const service = new AlertsPersistenceService(
      alertsRepo as never,
      configRepo as never,
    );

    await expect(service.getAlertsConfig('tenant-1')).resolves.toEqual([
      { id: 'config-1' },
    ]);
    expect(configRepo.find).toHaveBeenCalledWith({
      where: { tenant: { id: 'tenant-1' } },
      relations: ['gateway'],
    });
  });

  it('returns alerts in descending order and optional gateway filter', async () => {
    const alertsRepo = {
      find: jest.fn().mockResolvedValue([{ id: 'alert-1' }]),
    };
    const configRepo = {};
    const service = new AlertsPersistenceService(
      alertsRepo as never,
      configRepo as never,
    );

    await expect(
      service.getAlerts({
        tenantId: 'tenant-1',
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-01-02T00:00:00.000Z',
        gatewayId: 'gateway-1',
      }),
    ).resolves.toEqual([{ id: 'alert-1' }]);
    expect(alertsRepo.find).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        createdAt: Between(
          new Date('2024-01-01T00:00:00.000Z'),
          new Date('2024-01-02T00:00:00.000Z'),
        ),
        gatewayId: 'gateway-1',
      },
      order: { createdAt: 'DESC' },
    });
  });
});
