import { Injectable } from '@nestjs/common';
import { GatewayEntity } from '../../common/entities/gateway.entity';
import { Repository } from 'typeorm';
import {
  DeleteGatewayPersistenceInput,
  GetGatewayByIdPersistenceInput,
  GetGatewaysPersistenceInput,
  UpdateGatewayPersistenceInput,
} from '../interfaces/service-persistence.interfaces';

@Injectable()
export class GatewaysPersistenceService {
  constructor(private readonly r: Repository<GatewayEntity>) {}

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

  async updateGateway(
    input: UpdateGatewayPersistenceInput,
  ): Promise<GatewayEntity | null> {
    const gateway = await this.findById(input);
    if (!gateway) {
      return null;
    }

    if (input.name) {
      if (!gateway.metadata) {
        gateway.metadata = {
          gatewayId: gateway.id,
          gateway,
        } as GatewayEntity['metadata'];
      }
      gateway.metadata.name = input.name;
    }

    return this.r.save(gateway);
  }

  async decommissionGateway(
    input: DeleteGatewayPersistenceInput,
  ): Promise<GatewayEntity | null> {
    const gateway = await this.findById(input);
    if (!gateway) {
      return null;
    }

    gateway.provisioned = false;
    return this.r.save(gateway);
  }
}
