import { Between, IsNull, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AlertsPersistenceService } from './alerts.persistence.service';

type DefaultAlertConfigRow = {
  id: string;
  tenantId: string;
  gatewayId: null;
  gatewayTimeoutMs: number;
  updatedAt: Date;
};

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

  it('creates and returns default config when none exists', async () => {
    const alertsRepo = {};
    const configRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockReturnValue({
        tenantId: 'tenant-1',
        gatewayId: null,
        gatewayTimeoutMs: 60000,
      }),
      save: jest.fn().mockResolvedValue({ id: 'config-1' }),
      delete: jest.fn(),
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
    expect(configRepo.find).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', gatewayId: IsNull() },
      order: { updatedAt: 'DESC' },
    });
    expect(configRepo.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      gatewayId: null,
      gatewayTimeoutMs: 60000,
    });
    expect(configRepo.delete).not.toHaveBeenCalled();
  });

  it('updates latest default config and removes stale duplicates', async () => {
    const alertsRepo = {};
    const latest: DefaultAlertConfigRow = {
      id: 'config-new',
      tenantId: 'tenant-1',
      gatewayId: null,
      gatewayTimeoutMs: 2000,
      updatedAt: new Date('2026-04-05T01:13:27.600Z'),
    };
    const stale: DefaultAlertConfigRow = {
      id: 'config-old',
      tenantId: 'tenant-1',
      gatewayId: null,
      gatewayTimeoutMs: 5000,
      updatedAt: new Date('2026-04-04T08:55:48.637Z'),
    };
    const configRepo = {
      find: jest.fn().mockResolvedValue([latest, stale]),
      create: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((entity: DefaultAlertConfigRow) => entity),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const service = new AlertsPersistenceService(
      alertsRepo as never,
      configRepo as never,
    );

    await expect(
      service.setDefaultAlertsConfig({
        tenantId: 'tenant-1',
        defaultTimeoutMs: 2500,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'config-new',
        gatewayTimeoutMs: 2500,
      }),
    );
    expect(configRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'config-new', gatewayTimeoutMs: 2500 }),
    );
    expect(configRepo.delete).toHaveBeenCalledWith(['config-old']);
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
      where: { tenantId: 'tenant-1' },
      order: { updatedAt: 'DESC' },
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
