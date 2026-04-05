import { KeysService } from './keys.service';
import { GatewaysKeysPersistenceService } from './keys.persistence.service';
import { GatewaysService } from '../../gateways/services/gateways.service';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { GatewayModel } from '../../gateways/models/gateway.model';
import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { GatewayEntity } from '../../gateways/entities/gateway.entity';

jest.mock('bcrypt');

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
  let dataSource: jest.Mocked<DataSource>;
  let manager: jest.Mocked<EntityManager>;
  let service: KeysService;

  beforeEach(() => {
    persistence = {
      getKeys: jest.fn(),
      saveKeys: jest.fn(),
    } as unknown as jest.Mocked<GatewaysKeysPersistenceService>;
    gatewaysService = {
      findByIdUnscoped: jest.fn(),
      findByFactoryId: jest.fn(),
    } as unknown as jest.Mocked<GatewaysService>;
    manager = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;
    dataSource = {
      transaction: jest.fn((cb: (manager: EntityManager) => Promise<unknown>) =>
        cb(manager),
      ),
    } as unknown as jest.Mocked<DataSource>;
    service = new KeysService(persistence, gatewaysService, dataSource);
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

  describe('validateFactoryKey', () => {
    it('returns gateway and tenant ids when the factory key is valid', async () => {
      gatewaysService.findByFactoryId.mockResolvedValue({
        id: 'gateway-1',
        tenantId: 'tenant-1',
        factoryKey: 'hashed-key',
        provisioned: false,
      } as unknown as GatewayModel);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validateFactoryKey('factory-1', 'key-123'),
      ).resolves.toEqual({
        gatewayId: 'gateway-1',
        tenantId: 'tenant-1',
      });
    });

    it('throws UnauthorizedException if gateway does not exist', async () => {
      gatewaysService.findByFactoryId.mockResolvedValue(null);

      await expect(
        service.validateFactoryKey('factory-1', 'key-123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('completeProvisioning', () => {
    it('stores key material and marks the gateway as provisioned', async () => {
      gatewaysService.findByIdUnscoped.mockResolvedValue({
        id: 'gateway-1',
      } as unknown as GatewayModel);
      manager.create.mockImplementation(
        (_entity: unknown, payload: unknown) => payload as never,
      );

      await expect(
        service.completeProvisioning(
          'gateway-1',
          Buffer.from('secret').toString('base64'),
          2,
          5000,
          '1.2.3',
        ),
      ).resolves.toBeUndefined();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(dataSource.transaction).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(manager.create).toHaveBeenCalledWith(expect.anything(), {
        gatewayId: 'gateway-1',
        keyMaterial: Buffer.from('secret'),
        keyVersion: 2,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        'gateway-1',
        {
          provisioned: true,
          factoryKeyHash: null,
          firmwareVersion: '1.2.3',
        },
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          gatewayId: 'gateway-1',
          sendFrequencyMs: 5000,
          status: 'gateway_online',
        }),
      );
    });

    it('throws NotFoundException when provisioning an unknown gateway', async () => {
      gatewaysService.findByIdUnscoped.mockResolvedValue(null);

      await expect(
        service.completeProvisioning('missing', 'a2V5', 1, 5000),
      ).rejects.toThrow(NotFoundException);
    });

    it('does not overwrite firmware when firmwareVersion is empty', async () => {
      gatewaysService.findByIdUnscoped.mockResolvedValue({
        id: 'gateway-1',
      } as unknown as GatewayModel);
      manager.create.mockImplementation(
        (_entity: unknown, payload: unknown) => payload as never,
      );

      await expect(
        service.completeProvisioning(
          'gateway-1',
          Buffer.from('secret').toString('base64'),
          2,
          3000,
          '',
        ),
      ).resolves.toBeUndefined();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        'gateway-1',
        {
          provisioned: true,
          factoryKeyHash: null,
        },
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          gatewayId: 'gateway-1',
          sendFrequencyMs: 3000,
          status: 'gateway_online',
        }),
      );
    });
  });

  describe('provisionGateway', () => {
    const factoryId = 'factory-1';
    const factoryKey = 'key-123';
    const keyMaterial = Buffer.from('new-key').toString('base64');
    const firmwareVersion = '1.0.0';
    const model = 'M1';

    it('provisions gateway successfully', async () => {
      const gateway = {
        id: 'gateway-1',
        factoryId,
        factoryKey: 'hashed-key',
        provisioned: false,
      } as unknown as GatewayModel;

      gatewaysService.findByFactoryId.mockResolvedValue(gateway);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      manager.find.mockResolvedValue([]);

      await service.provisionGateway(
        factoryId,
        factoryKey,
        keyMaterial,
        firmwareVersion,
        model,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(dataSource.transaction).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(manager.create).toHaveBeenCalledWith(expect.anything(), {
        gatewayId: 'gateway-1',
        keyMaterial: Buffer.from(keyMaterial, 'base64'),
        keyVersion: 1,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        'gateway-1',
        {
          provisioned: true,
          factoryKeyHash: null,
          firmwareVersion,
          model,
        },
      );
    });

    it('throws ConflictException if already provisioned', async () => {
      gatewaysService.findByFactoryId.mockResolvedValue({
        provisioned: true,
      } as unknown as GatewayModel);

      await expect(
        service.provisionGateway(
          factoryId,
          factoryKey,
          keyMaterial,
          firmwareVersion,
          model,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws UnauthorizedException if factory key is invalid', async () => {
      gatewaysService.findByFactoryId.mockResolvedValue({
        provisioned: false,
        factoryKey: 'hashed-key',
      } as unknown as GatewayModel);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.provisionGateway(
          factoryId,
          factoryKey,
          keyMaterial,
          firmwareVersion,
          model,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
