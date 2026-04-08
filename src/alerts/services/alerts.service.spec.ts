import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AlertType } from '../enums/alerts.enum';
import { AlertsService } from './alerts.service';
import { AlertsPersistenceService } from './alerts.persistence.service';
import { GatewaysService } from '../../gateways/services/gateways.service';

const createAlertsConfigEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'config-1',
  tenantId: 'tenant-1',
  gatewayId: null,
  gatewayTimeoutMs: 60000,
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

const createAlertsEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'alert-1',
  tenantId: 'tenant-1',
  type: AlertType.GATEWAY_OFFLINE,
  gatewayId: 'gateway-1',
  details: { message: 'Gateway offline' },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('AlertsService', () => {
  it('throws when setting gateway config for a missing gateway', async () => {
    const persistence = {} as AlertsPersistenceService;
    const gateways = {
      findByIdUnscoped: jest.fn().mockResolvedValue(null),
    } as unknown as GatewaysService;
    const service = new AlertsService(persistence, gateways);

    await expect(
      service.setGatewayAlertsConfig({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        gatewayTimeoutMs: 30000,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when the gateway belongs to another tenant', async () => {
    const persistence = {} as AlertsPersistenceService;
    const gateways = {
      findByIdUnscoped: jest.fn().mockResolvedValue({ tenantId: 'tenant-2' }),
    } as unknown as GatewaysService;
    const service = new AlertsService(persistence, gateways);

    await expect(
      service.setGatewayAlertsConfig({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        gatewayTimeoutMs: 30000,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('stores gateway-specific alert config', async () => {
    const persistence = {
      setGatewayAlertsConfig: jest.fn().mockResolvedValue(
        createAlertsConfigEntity({
          gatewayId: 'gateway-1',
          gatewayTimeoutMs: 30000,
        }),
      ),
    } as unknown as AlertsPersistenceService;
    const gateways = {
      findByIdUnscoped: jest.fn().mockResolvedValue({ tenantId: 'tenant-1' }),
    } as unknown as GatewaysService;
    const service = new AlertsService(persistence, gateways);

    await expect(
      service.setGatewayAlertsConfig({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        gatewayTimeoutMs: 30000,
      }),
    ).resolves.toEqual(expect.objectContaining({ gatewayId: 'gateway-1' }));
  });

  it('deletes gateway-specific alert config', async () => {
    const persistence = {
      deleteGatewayAlertsConfig: jest.fn().mockResolvedValue(true),
    } as unknown as AlertsPersistenceService;
    const gateways = {
      findByIdUnscoped: jest.fn().mockResolvedValue({ tenantId: 'tenant-1' }),
    } as unknown as GatewaysService;
    const service = new AlertsService(persistence, gateways);

    await expect(
      service.deleteGatewayAlertsConfig('tenant-1', 'gateway-1'),
    ).resolves.toBeUndefined();
  });

  it('throws when deleting config for a missing gateway', async () => {
    const persistence = {} as AlertsPersistenceService;
    const gateways = {
      findByIdUnscoped: jest.fn().mockResolvedValue(null),
    } as unknown as GatewaysService;
    const service = new AlertsService(persistence, gateways);

    await expect(
      service.deleteGatewayAlertsConfig('tenant-1', 'gateway-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when deleting config for a gateway in another tenant', async () => {
    const persistence = {} as AlertsPersistenceService;
    const gateways = {
      findByIdUnscoped: jest.fn().mockResolvedValue({ tenantId: 'tenant-2' }),
    } as unknown as GatewaysService;
    const service = new AlertsService(persistence, gateways);

    await expect(
      service.deleteGatewayAlertsConfig('tenant-1', 'gateway-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws when gateway config deletion reports nothing deleted', async () => {
    const persistence = {
      deleteGatewayAlertsConfig: jest.fn().mockResolvedValue(false),
    } as unknown as AlertsPersistenceService;
    const gateways = {
      findByIdUnscoped: jest.fn().mockResolvedValue({ tenantId: 'tenant-1' }),
    } as unknown as GatewaysService;
    const service = new AlertsService(persistence, gateways);

    await expect(
      service.deleteGatewayAlertsConfig('tenant-1', 'gateway-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('stores default alert config', async () => {
    const persistence = {
      setDefaultAlertsConfig: jest
        .fn()
        .mockResolvedValue(createAlertsConfigEntity()),
    } as unknown as AlertsPersistenceService;
    const gateways = {} as GatewaysService;
    const service = new AlertsService(persistence, gateways);

    await expect(
      service.setDefaultAlertsConfig({
        tenantId: 'tenant-1',
        defaultTimeoutMs: 60000,
      }),
    ).resolves.toEqual(expect.objectContaining({ tenantId: 'tenant-1' }));
  });

  it('maps alert configuration', async () => {
    const persistence = {
      getAlertsConfig: jest.fn().mockResolvedValue([
        createAlertsConfigEntity(),
        createAlertsConfigEntity({
          id: 'config-2',
          gatewayId: 'gateway-1',
          gatewayTimeoutMs: 45000,
        }),
      ]),
    } as unknown as AlertsPersistenceService;
    const gateways = {} as GatewaysService;
    const service = new AlertsService(persistence, gateways);

    await expect(
      service.getAlertsConfig({ tenantId: 'tenant-1' }),
    ).resolves.toEqual({
      defaultTimeoutMs: 60000,
      defaultUpdatedAt: new Date('2024-01-01T00:00:00.000Z'),
      gatewayOverrides: [
        expect.objectContaining({
          gatewayId: 'gateway-1',
          gatewayTimeoutMs: 45000,
        }),
      ],
    });
  });

  it('maps alerts to models', async () => {
    const persistence = {
      getAlerts: jest.fn().mockResolvedValue([createAlertsEntity()]),
    } as unknown as AlertsPersistenceService;
    const gateways = {} as GatewaysService;
    const service = new AlertsService(persistence, gateways);

    await expect(
      service.getAlerts({
        tenantId: 'tenant-1',
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-01-02T00:00:00.000Z',
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'alert-1',
        gatewayId: 'gateway-1',
        type: AlertType.GATEWAY_OFFLINE,
      }),
    ]);
  });
});
