import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewayEntity } from '../../../gateways/entities/gateway.entity';
import {
  AddGatewayPersistenceInput,
  GetGatewaysPersistenceInput,
} from '../interfaces/service-persistence.interfaces';

@Injectable()
export class GatewaysPersistenceService {
  constructor(
    @InjectRepository(GatewayEntity)
    private readonly r: Repository<GatewayEntity>,
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
    return this.r.save(entity);
  }
}
