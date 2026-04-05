import { NotFoundException } from '@nestjs/common';
import { GatewaysService } from './gateways.service';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { GatewayStatus } from '../enums/gateway.enum';

const createGatewayEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'gateway-1',
  metadata: {
    name: 'Gateway A',
    status: 'online',
    lastSeenAt: new Date('2024-01-01T00:00:00.000Z'),
    sendFrequencyMs: 30000,
  },
  factoryKeyHash: 'factory-key',
  factoryId: 'factory-id',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  firmwareVersion: '1.0.0',
  model: 'nx-1',
  tenantId: 'tenant-1',
  provisioned: true,
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
  ...overrides,
});

describe('GatewaysService', () => {
  it('returns mapped gateways', async () => {
    const persistence = {
      getGateways: jest.fn().mockResolvedValue([createGatewayEntity()]),
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(
      service.getGateways({ tenantId: 'tenant-1' }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'gateway-1',
        name: 'Gateway A',
        tenantId: 'tenant-1',
      }),
    ]);
  });

  it('returns an empty list when no gateways are found', async () => {
    const persistence = {
      getGateways: jest.fn().mockResolvedValue([]),
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(
      service.getGateways({ tenantId: 'tenant-1' }),
    ).resolves.toEqual([]);
  });

  it('returns a gateway by id', async () => {
    const persistence = {
      findById: jest.fn().mockResolvedValue(createGatewayEntity()),
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(
      service.findById({ tenantId: 'tenant-1', gatewayId: 'gateway-1' }),
    ).resolves.toEqual(expect.objectContaining({ id: 'gateway-1' }));
  });

  it('throws when a gateway by id is missing', async () => {
    const persistence = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(
      service.findById({ tenantId: 'tenant-1', gatewayId: 'gateway-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns null when an unscoped gateway is missing', async () => {
    const persistence = {
      findByIdUnscoped: jest.fn().mockResolvedValue(null),
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(service.findByIdUnscoped('gateway-1')).resolves.toBeNull();
  });

  it('returns a gateway by factory id', async () => {
    const persistence = {
      findByFactoryId: jest.fn().mockResolvedValue(createGatewayEntity()),
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(service.findByFactoryId('factory-id')).resolves.toEqual(
      expect.objectContaining({ id: 'gateway-1', factoryId: 'factory-id' }),
    );
  });

  it('returns null when a factory id is missing', async () => {
    const persistence = {
      findByFactoryId: jest.fn().mockResolvedValue(null),
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(service.findByFactoryId('factory-id')).resolves.toBeNull();
  });

  it('returns empty alerts for a gateway placeholder method', () => {
    const persistence = {} as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    expect(service.getAlertsForGateway('gateway-1')).toEqual([]);
  });

  it('updates a gateway', async () => {
    const persistence = {
      updateGateway: jest.fn().mockResolvedValue(createGatewayEntity()),
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(
      service.updateGateway({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        name: 'Updated Gateway',
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'gateway-1' }));
  });

  it('throws when updating a missing gateway', async () => {
    const persistence = {
      updateGateway: jest.fn().mockResolvedValue(null),
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(
      service.updateGateway({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        name: 'Updated Gateway',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when deleting a missing gateway', async () => {
    const persistence = {
      deleteGateway: jest.fn().mockResolvedValue(null),
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(
      service.deleteGateway({ tenantId: 'tenant-1', gatewayId: 'gateway-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing gateway', async () => {
    const deleteGatewayMock = jest.fn().mockResolvedValue({ id: 'gateway-1' });
    const persistence = {
      deleteGateway: deleteGatewayMock,
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(
      service.deleteGateway({ tenantId: 'tenant-1', gatewayId: 'gateway-1' }),
    ).resolves.toBeUndefined();
    expect(deleteGatewayMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
    });
  });

  it('returns true when runtime status update succeeds', async () => {
    const updateGatewayRuntimeStatus = jest
      .fn()
      .mockResolvedValue(createGatewayEntity());
    const persistence = {
      updateGatewayRuntimeStatus,
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(
      service.updateGatewayRuntimeStatus(
        'gateway-1',
        GatewayStatus.GATEWAY_ONLINE,
        new Date('2026-04-04T17:00:00.000Z'),
      ),
    ).resolves.toBe(true);
  });

  it('returns false when runtime status update target is missing', async () => {
    const updateGatewayRuntimeStatus = jest.fn().mockResolvedValue(null);
    const persistence = {
      updateGatewayRuntimeStatus,
    } as unknown as GatewaysPersistenceService;
    const service = new GatewaysService(persistence);

    await expect(
      service.updateGatewayRuntimeStatus(
        'gateway-1',
        GatewayStatus.GATEWAY_OFFLINE,
        new Date('2026-04-04T17:00:00.000Z'),
      ),
    ).resolves.toBe(false);
  });
});
