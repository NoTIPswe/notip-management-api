import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GatewayModel } from './models/gateway.model';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import {
  DeleteGatewayInput,
  GetGatewayByIdInput,
  GetGatewaysInput,
  UpdateGatewayInput,
} from './interfaces/controller-service.interfaces';
import { GatewaysMapper } from './gateways.mapper';

@Injectable()
export class GatewaysService {
  constructor(private readonly gps: GatewaysPersistenceService) {}

  async getGateways(input: GetGatewaysInput): Promise<GatewayModel[]> {
    const entities = await this.gps.getGateways({ tenantId: input.tenantId });
    if (entities.length === 0) {
      throw new NotFoundException('No gateways found for this tenant');
    }
    return entities.map(GatewaysMapper.toModel);
  }

  async findById(input: GetGatewayByIdInput): Promise<GatewayModel> {
    const entity = await this.gps.findById({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
    });
    if (!entity) {
      throw new NotFoundException('Gateway not found');
    }
    return GatewaysMapper.toModel(entity);
  }

  async findByIdUnscoped(gatewayId: string): Promise<GatewayModel | null> {
    const entity = await this.gps.findByIdUnscoped(gatewayId);
    if (!entity) {
      return null;
    }
    return GatewaysMapper.toModel(entity);
  }

  async updateGateway(input: UpdateGatewayInput): Promise<GatewayModel> {
    const entity = await this.gps.updateGateway({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
      name: input.name,
    });
    if (!entity) {
      throw new NotFoundException('Gateway not found');
    }
    return GatewaysMapper.toModel(entity);
  }

  async deleteGateway(input: DeleteGatewayInput): Promise<void> {
    const gateway = await this.gps.findById({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
    });
    if (!gateway) {
      throw new NotFoundException('Gateway not found');
    }
    if (!gateway.provisioned) {
      throw new ConflictException('Gateway already decommissioned');
    }
    await this.gps.decommissionGateway({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
    });
  }
}
