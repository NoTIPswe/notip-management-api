import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewayEntity } from '../entities/gateway.entity';
import { GatewayMetadataEntity } from '../entities/gateway-metadata.entity';
import { DEFAULT_GATEWAY_SEND_FREQUENCY_MS } from '../gateway.constants';
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

  async updateGatewayRuntimeStatus(input: {
    gatewayId: string;
    status: GatewayStatus;
    lastSeenAt: Date;
  }): Promise<GatewayEntity | null> {
    const gateway = await this.findByIdUnscoped(input.gatewayId);
    if (!gateway) {
      return null;
    }

    if (gateway.metadata) {
      gateway.metadata.status = input.status;
      gateway.metadata.lastSeenAt = input.lastSeenAt;
    } else {
      gateway.metadata = {
        gatewayId: gateway.id,
        gateway,
        sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
        status: input.status,
        lastSeenAt: input.lastSeenAt,
      } as GatewayEntity['metadata'];
    }

    return this.r.save(gateway);
  }

  async updateGateway(
    input: UpdateGatewayPersistenceInput,
  ): Promise<GatewayEntity | null> {
    const gateway = await this.findById(input);
    if (!gateway) {
      return null;
    }

    if (typeof input.name === 'string') {
      if (gateway.metadata) {
        gateway.metadata.name = input.name;
      } else {
        gateway.metadata = this.metadataRepo.create({
          gatewayId: gateway.id,
          name: input.name,
          sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
        } as GatewayEntity['metadata']);
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
