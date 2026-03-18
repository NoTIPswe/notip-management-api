import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { AlertsPersistenceService } from './alerts.persistence.service';
import { GatewaysService } from 'src/gateways/gateways.service';
import { GatewayStatus } from 'src/common/enums/gateway.enum';

describe('AlertsService', () => {
  let service: AlertsService;
  let alertsPersistenceService: {
    setGatewayAlertsConfig: jest.Mock;
    setDefaultAlertsConfig: jest.Mock;
    getAlertsConfig: jest.Mock;
  };
  let gatewaysService: {
    findByIdUnscoped: jest.Mock;
  };

  beforeEach(async () => {
    alertsPersistenceService = {
      setGatewayAlertsConfig: jest.fn(),
      setDefaultAlertsConfig: jest.fn(),
      getAlertsConfig: jest.fn(),
    };

    gatewaysService = {
      findByIdUnscoped: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: AlertsPersistenceService,
          useValue: alertsPersistenceService,
        },
        {
          provide: GatewaysService,
          useValue: gatewaysService,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  it('throws 404 when the gateway does not exist', async () => {
    gatewaysService.findByIdUnscoped.mockResolvedValue(null);

    await expect(
      service.setGatewayAlertsConfig({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        gatewayTimeoutMs: 60000,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(alertsPersistenceService.setGatewayAlertsConfig).not.toHaveBeenCalled();
  });

  it('throws 403 when the gateway belongs to a different tenant', async () => {
    gatewaysService.findByIdUnscoped.mockResolvedValue({
      id: 'gateway-2',
      name: 'Gateway',
      status: GatewayStatus.GATEWAY_OFFLINE,
      lastSeenAt: null,
      sendFrequencyMs: 60000,
      factoryKey: 'hash',
      factoryId: 'factory-1',
      createdAt: new Date(),
      firmwareVersion: '1.0.0',
      model: 'mx',
      tenantId: 'tenant-2',
      provisioned: true,
    });

    await expect(
      service.setGatewayAlertsConfig({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-2',
        gatewayTimeoutMs: 60000,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(gatewaysService.findByIdUnscoped).toHaveBeenCalledWith('gateway-2');
    expect(alertsPersistenceService.setGatewayAlertsConfig).not.toHaveBeenCalled();
  });

  it('writes config when the gateway belongs to the authenticated tenant', async () => {
    gatewaysService.findByIdUnscoped.mockResolvedValue({
      id: 'gateway-1',
      name: 'Gateway',
      status: GatewayStatus.GATEWAY_OFFLINE,
      lastSeenAt: null,
      sendFrequencyMs: 60000,
      factoryKey: 'hash',
      factoryId: 'factory-1',
      createdAt: new Date(),
      firmwareVersion: '1.0.0',
      model: 'mx',
      tenantId: 'tenant-1',
      provisioned: true,
    });
    alertsPersistenceService.setGatewayAlertsConfig.mockResolvedValue({
      id: 'cfg-1',
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      gatewayTimeoutMs: 90000,
      updatedAt: new Date('2026-03-18T10:00:00.000Z'),
    });

    const result = await service.setGatewayAlertsConfig({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      gatewayTimeoutMs: 90000,
    });

    expect(alertsPersistenceService.setGatewayAlertsConfig).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      gatewayTimeoutMs: 90000,
    });
    expect(result).toEqual({
      id: 'cfg-1',
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      gatewayTimeoutMs: 90000,
      updatedAt: new Date('2026-03-18T10:00:00.000Z'),
    });
  });

  it('loads tenant alert config scoped by tenant id', async () => {
    alertsPersistenceService.getAlertsConfig.mockResolvedValue([
      {
        id: 'cfg-default',
        tenantId: 'tenant-1',
        gatewayId: null,
        gatewayTimeoutMs: 60000,
        updatedAt: new Date('2026-03-18T10:00:00.000Z'),
      },
      {
        id: 'cfg-gateway',
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        gatewayTimeoutMs: 90000,
        updatedAt: new Date('2026-03-18T11:00:00.000Z'),
      },
    ]);

    const result = await service.getAlertsConfig({ tenantId: 'tenant-1' });

    expect(alertsPersistenceService.getAlertsConfig).toHaveBeenCalledWith('tenant-1');
    expect(result).toEqual({
      defaultTimeoutMs: 60000,
      gatewayOverrides: [
        {
          gatewayId: 'gateway-1',
          gatewayTimeoutMs: 90000,
          updatedAt: new Date('2026-03-18T11:00:00.000Z'),
        },
      ],
    });
  });
});
