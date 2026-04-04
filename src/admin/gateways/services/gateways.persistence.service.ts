import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewayEntity } from '../../../gateways/entities/gateway.entity';
import { GatewayMetadataEntity } from '../../../gateways/entities/gateway-metadata.entity';
import { DEFAULT_GATEWAY_SEND_FREQUENCY_MS } from '../../../gateways/gateway.constants';
import {
  AddGatewayPersistenceInput,
  GetGatewaysPersistenceInput,
} from '../interfaces/service-persistence.interfaces';

@Injectable()
export class GatewaysPersistenceService {
  constructor(
    @InjectRepository(GatewayEntity)
    private readonly r: Repository<GatewayEntity>,
    @InjectRepository(GatewayMetadataEntity)
    private readonly metadataRepository: Repository<GatewayMetadataEntity>,
  ) {}

  async getGateways(
    input: GetGatewaysPersistenceInput,
  ): Promise<GatewayEntity[]> {
    return this.r.find({
      where: input.tenantId ? { tenantId: input.tenantId } : {},
    });
  }

  async addGateway(input: AddGatewayPersistenceInput): Promise<GatewayEntity> {
    const entity = this.r.create({
      tenantId: input.tenantId,
      tenant: { id: input.tenantId },
      factoryId: input.factoryId,
      factoryKeyHash: input.factoryKeyHash,
      model: input.model,
      firmwareVersion: input.firmwareVersion,
      createdAt: new Date(),
    });
    const savedGateway = await this.r.save(entity);

    const metadata = this.metadataRepository.create({
      gatewayId: savedGateway.id,
      gateway: savedGateway,
      sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
    });
    savedGateway.metadata = await this.metadataRepository.save(metadata);

    return savedGateway;
  }
}
