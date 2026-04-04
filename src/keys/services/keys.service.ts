import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GatewaysKeysPersistenceService } from './keys.persistence.service';
import { KeyModel } from '../models/key.model';
import { KeyMapper } from '../keys.mapper';
import { GatewaysService } from '../../gateways/services/gateways.service';
import { DataSource } from 'typeorm';
import { KeyEntity } from '../entities/key.entity';
import { GatewayEntity } from '../../gateways/entities/gateway.entity';
import { GatewayMetadataEntity } from '../../gateways/entities/gateway-metadata.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class KeysService {
  constructor(
    private readonly gkp: GatewaysKeysPersistenceService,
    private readonly gs: GatewaysService,
    private readonly dataSource: DataSource,
  ) {}
  async getKeys(id: string, tenantId?: string): Promise<KeyModel[]> {
    const gateway = await this.gs.findByIdUnscoped(id);
    if (!gateway) {
      throw new NotFoundException('Gateway not found');
    }

    if (tenantId && gateway.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Gateway does not belong to the requested tenant',
      );
    }

    const keys = await this.gkp.getKeys(id);
    return KeyMapper.toKeyModels(keys);
  }
  async saveKeys(
    id: string,
    keyMaterial: Buffer,
    keyVersion: number,
  ): Promise<KeyModel> {
    const key = await this.gkp.saveKeys(id, keyMaterial, keyVersion);
    return KeyMapper.toKeyModels([key])[0];
  }

  async validateFactoryKey(
    factoryId: string,
    factoryKey: string,
  ): Promise<{ gatewayId: string; tenantId: string }> {
    const gateway = await this.gs.findByFactoryId(factoryId);
    if (!gateway) {
      throw new UnauthorizedException('INVALID');
    }

    if (gateway.provisioned) {
      throw new ConflictException('ALREADY_PROVISIONED');
    }

    const isKeyValid = await bcrypt.compare(factoryKey, gateway.factoryKey);
    if (!isKeyValid) {
      throw new UnauthorizedException('INVALID');
    }

    return { gatewayId: gateway.id, tenantId: gateway.tenantId };
  }

  async completeProvisioning(
    gatewayId: string,
    keyMaterial: string,
    keyVersion: number,
    sendFrequencyMs: number,
    firmwareVersion?: string,
  ): Promise<void> {
    const gateway = await this.gs.findByIdUnscoped(gatewayId);
    if (!gateway) {
      throw new NotFoundException('Gateway not found');
    }

    await this.dataSource.transaction(async (manager) => {
      // Save new key material
      const key = manager.create(KeyEntity, {
        gatewayId: gateway.id,
        keyMaterial: Buffer.from(keyMaterial, 'base64'),
        keyVersion,
      });
      await manager.save(key);

      // Update gateway status
      await manager.update(GatewayEntity, gateway.id, {
        provisioned: true,
        factoryKeyHash: null,
        ...(firmwareVersion && firmwareVersion.trim().length > 0
          ? { firmwareVersion }
          : {}),
      });

      const metadata = manager.create(GatewayMetadataEntity, {
        gatewayId: gateway.id,
        sendFrequencyMs,
      });
      await manager.save(metadata);
    });
  }

  async provisionGateway(
    factoryId: string,
    factoryKey: string,
    keyMaterial: string,
    firmwareVersion: string,
    model: string,
  ): Promise<void> {
    const { gatewayId } = await this.validateFactoryKey(factoryId, factoryKey);

    await this.dataSource.transaction(async (manager) => {
      // 1. Get current keys to determine next version
      const keys = await manager.find(KeyEntity, {
        where: { gatewayId: gatewayId },
      });
      const nextVersion =
        keys.length > 0 ? Math.max(...keys.map((k) => k.keyVersion)) + 1 : 1;

      // 2. Save new key material
      const key = manager.create(KeyEntity, {
        gatewayId: gatewayId,
        keyMaterial: Buffer.from(keyMaterial, 'base64'),
        keyVersion: nextVersion,
      });
      await manager.save(key);

      // 3. Update gateway status
      await manager.update(GatewayEntity, gatewayId, {
        provisioned: true,
        factoryKeyHash: null,
        firmwareVersion,
        model,
      });
    });
  }
}
