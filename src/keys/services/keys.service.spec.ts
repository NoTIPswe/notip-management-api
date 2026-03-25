import { KeysService } from './keys.service';
import { GatewaysKeysPersistenceService } from './keys.persistence.service';
import { GatewaysService } from '../../gateways/services/gateways.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GatewayModel } from '../../gateways/models/gateway.model';

import { GatewayEntity } from '../../gateways/entities/gateway.entity';

const createKeyEntity = (overrides: Record<string, unknown> = {}) => ({
  id: 'key-1',
  gatewayId: 'gateway-1',
  keyMaterial: Buffer.from('secret'),
  keyVersion: 1,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  revokedAt: null,
  gateway: {} as unknown as GatewayEntity,
  ...overrides,
});

describe('KeysService', () => {
  let persistence: jest.Mocked<GatewaysKeysPersistenceService>;
  let gatewaysService: jest.Mocked<GatewaysService>;
  let service: KeysService;

  beforeEach(() => {
    persistence = {
      getKeys: jest.fn(),
      saveKeys: jest.fn(),
    } as unknown as jest.Mocked<GatewaysKeysPersistenceService>;
    gatewaysService = {
      findByIdUnscoped: jest.fn(),
    } as unknown as jest.Mocked<GatewaysService>;
    service = new KeysService(persistence, gatewaysService);
  });

  it('returns mapped keys', async () => {
    gatewaysService.findByIdUnscoped.mockResolvedValue({
      id: 'gateway-1',
      tenantId: 'tenant-1',
    } as unknown as GatewayModel);
    persistence.getKeys.mockResolvedValue([createKeyEntity()]);

    await expect(service.getKeys('gateway-1', 'tenant-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'key-1',
        gatewayId: 'gateway-1',
        keyVersion: 1,
      }),
    ]);
  });

  it('throws NotFoundException if gateway not found', async () => {
    gatewaysService.findByIdUnscoped.mockResolvedValue(null);

    await expect(service.getKeys('gateway-1', 'tenant-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException if tenantId mismatch', async () => {
    gatewaysService.findByIdUnscoped.mockResolvedValue({
      id: 'gateway-1',
      tenantId: 'other',
    } as unknown as GatewayModel);

    await expect(service.getKeys('gateway-1', 'tenant-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('saves keys and returns the mapped key', async () => {
    persistence.saveKeys.mockResolvedValue(createKeyEntity());
    const keyMaterial = Buffer.from('secret');

    await expect(
      service.saveKeys('gateway-1', keyMaterial, 1),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'key-1',
        gatewayId: 'gateway-1',
        keyVersion: 1,
      }),
    );
  });
});
