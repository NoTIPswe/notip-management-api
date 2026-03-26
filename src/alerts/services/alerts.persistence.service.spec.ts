import { Between, IsNull, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
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

  it('returns whether deleting gateway config affected any rows', async () => {
    const alertsRepo = {};
    const configRepo = {
      delete: jest
        .fn()
        .mockResolvedValueOnce({ affected: 1 })
        .mockResolvedValueOnce({ affected: 0 }),
    };
    const service = new AlertsPersistenceService(
      alertsRepo as never,
      configRepo as never,
    );

    await expect(
      service.deleteGatewayAlertsConfig('tenant-1', 'gateway-1'),
    ).resolves.toBe(true);
    await expect(
      service.deleteGatewayAlertsConfig('tenant-1', 'gateway-1'),
    ).resolves.toBe(false);
  });

  it('filters alerts with only a start date', async () => {
    const alertsRepo = {
      find: jest.fn().mockResolvedValue([]),
    };
    const configRepo = {};
    const service = new AlertsPersistenceService(
      alertsRepo as never,
      configRepo as never,
    );

    await service.getAlerts({
      tenantId: 'tenant-1',
      from: '2024-01-01T00:00:00.000Z',
    });

    expect(alertsRepo.find).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        createdAt: MoreThanOrEqual(new Date('2024-01-01T00:00:00.000Z')),
      },
      order: { createdAt: 'DESC' },
    });
  });

  it('filters alerts with only an end date', async () => {
    const alertsRepo = {
      find: jest.fn().mockResolvedValue([]),
    };
    const configRepo = {};
    const service = new AlertsPersistenceService(
      alertsRepo as never,
      configRepo as never,
    );

    await service.getAlerts({
      tenantId: 'tenant-1',
      to: '2024-01-02T00:00:00.000Z',
    });

    expect(alertsRepo.find).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        createdAt: LessThanOrEqual(new Date('2024-01-02T00:00:00.000Z')),
      },
      order: { createdAt: 'DESC' },
    });
  });

  it('counts alerts for a tenant', async () => {
    const alertsRepo = {
      count: jest.fn().mockResolvedValue(5),
    };
    const configRepo = {};
    const service = new AlertsPersistenceService(
      alertsRepo as never,
      configRepo as never,
    );

    await expect(service.countAlerts('tenant-1')).resolves.toBe(5);
    expect(alertsRepo.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
    });
  });
});
