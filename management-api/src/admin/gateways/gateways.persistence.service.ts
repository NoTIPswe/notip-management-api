import { Injectable } from '@nestjs/common';
import { GatewaysEntity } from 'src/common/entities/gateways.entity';
import { Repository } from 'typeorm';
import { AddGatewayPersistenceInput } from './interfaces/service-persistence.interfaces';
@Injectable()
export class GatewaysPersistenceService {
  constructor(private readonly r: Repository<GatewaysEntity>) {}

  async getGateways(tenantId?: string): Promise<GatewaysEntity[]> {
    return this.r.find({
      where: tenantId ? { tenantId } : {},
    });
  }

  async addGateway(input: AddGatewayPersistenceInput): Promise<GatewaysEntity> {
    const entity = this.r.create({
      tenant: { id: input.tenantId },
      factoryId: input.factoryId,
      factoryKeyHash: input.factoryKeyHash,
    });
    return this.r.save(entity);
  }
}
