import { Injectable } from '@nestjs/common';
import { GatewayEntity } from 'src/common/entities/gateway.entity';
import { Repository } from 'typeorm';
import {
  AddGatewayPersistenceInput,
  GetGatewaysPersistenceInput,
} from './interfaces/service-persistence.interfaces';
@Injectable()
export class GatewaysPersistenceService {
  constructor(private readonly r: Repository<GatewayEntity>) {}

  async getGateways(
    input: GetGatewaysPersistenceInput,
  ): Promise<GatewayEntity[]> {
    return this.r.find({
      where: input.tenantId ? { tenantId: input.tenantId } : {},
    });
  }

  async addGateway(input: AddGatewayPersistenceInput): Promise<GatewayEntity> {
    const entity = this.r.create({
      tenant: { id: input.tenantId },
      factoryId: input.factoryId,
      factoryKeyHash: input.factoryKeyHash,
    });
    return this.r.save(entity);
  }
}
