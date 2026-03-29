import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewayEntity } from '../entities/gateway.entity';
import { GatewayMetadataEntity } from '../entities/gateway-metadata.entity';
import { GatewayStatus } from '../enums/gateway.enum';
import {
  DeleteGatewayPersistenceInput,
  GetGatewayByIdPersistenceInput,
  GetGatewaysPersistenceInput,
  UpdateGatewayPersistenceInput,
} from '../interfaces/service-persistence.interfaces';

@Injectable()
export class GatewaysPersistenceService {
  constructor(
    @InjectRepository(GatewayEntity)
    private readonly r: Repository<GatewayEntity>,
    @InjectRepository(GatewayMetadataEntity)
    private readonly metadataRepo: Repository<GatewayMetadataEntity>,
  ) {}

  async getGateways(
    input: GetGatewaysPersistenceInput,
  ): Promise<GatewayEntity[]> {
    return this.r.find({
      where: { tenantId: input.tenantId },
      relations: ['metadata'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(
    input: GetGatewayByIdPersistenceInput,
  ): Promise<GatewayEntity | null> {
    return this.r.findOne({
      where: { id: input.gatewayId, tenantId: input.tenantId },
      relations: ['metadata'],
    });
  }

  async findByIdUnscoped(gatewayId: string): Promise<GatewayEntity | null> {
    return this.r.findOne({
      where: { id: gatewayId },
      relations: ['metadata'],
    });
  }

  async findByFactoryId(factoryId: string): Promise<GatewayEntity | null> {
    return this.r.findOne({
      where: { factoryId },
      select: [
        'id',
        'tenantId',
        'factoryId',
        'factoryKeyHash',
        'provisioned',
        'model',
        'firmwareVersion',
        'createdAt',
        'updatedAt',
      ],
      relations: ['metadata'],
    });
  }

  async updateStatus(
    gatewayId: string,
    status: GatewayStatus,
    lastSeenAt: Date,
  ): Promise<boolean> {
    const gateway = await this.findByIdUnscoped(gatewayId);
    if (!gateway) return false;

    if (!gateway.metadata) {
      gateway.metadata = this.metadataRepo.create({
        gatewayId: gateway.id,
        status,
        lastSeenAt,
      });
    } else {
      gateway.metadata.status = status;
      gateway.metadata.lastSeenAt = lastSeenAt;
    }

    await this.metadataRepo.save(gateway.metadata);
    return true;
  }

  async updateGateway(
    input: UpdateGatewayPersistenceInput,
  ): Promise<GatewayEntity | null> {
    const gateway = await this.findById(input);
    if (!gateway) {
      return null;
    }

    if (typeof input.name === 'string') {
      if (!gateway.metadata) {
        gateway.metadata = this.metadataRepo.create({
          gatewayId: gateway.id,
          name: input.name,
          sendFrequencyMs: 0,
        });
      } else {
        gateway.metadata.name = input.name;
      }
    }

    return this.r.save(gateway);
  }

  async deleteGateway(
    input: DeleteGatewayPersistenceInput,
  ): Promise<GatewayEntity | null> {
    const gateway = await this.findById(input);
    if (!gateway) {
      return null;
    }

    return this.r.remove(gateway);
  }
}
