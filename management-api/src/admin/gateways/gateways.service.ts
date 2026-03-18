import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { GatewayModel } from './gateway.model';
import { AddGatewayInput } from './interfaces/controller-service.interfaces';
import { GatewaysMapper } from './gateways.mapper';

@Injectable()
export class GatewaysService {
  constructor(private readonly gps: GatewaysPersistenceService) {}

  async getGateways(tenantId?: string): Promise<GatewayModel[]> {
    const gateways = await this.gps.getGateways(tenantId);
    return gateways.map((g) => GatewaysMapper.toModel(g));
  }
  async addGateway(input: AddGatewayInput): Promise<GatewayModel> {
    try {
      const entity = await this.gps.addGateway(input);
      return GatewaysMapper.toModel(entity);
    } catch (e) {
      if (e.code === '23503') throw new NotFoundException('Tenant not found');
      if (e.code === '23505')
        throw new ConflictException('Factory ID already registered');
      throw e;
    }
  }
}
