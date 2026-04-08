import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GatewayModel } from '../models/gateway.model';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { GatewayStatus } from '../enums/gateway.enum';
import {
  DeleteGatewayInput,
  GetGatewayByIdInput,
  GetGatewaysInput,
  UpdateGatewayInput,
} from '../interfaces/controller-service.interfaces';
import { GatewaysMapper } from '../gateways.mapper';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GatewaysService {
  private readonly logger = new Logger(GatewaysService.name);

  constructor(
    private readonly gps: GatewaysPersistenceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getAlertsForGateway(gatewayId: string) {
    void gatewayId;
    return [];
  }

  async getGateways(input: GetGatewaysInput): Promise<GatewayModel[]> {
    const entities = await this.gps.getGateways({ tenantId: input.tenantId });
    return entities.map((entity) => GatewaysMapper.toModel(entity));
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

  async findByFactoryId(factoryId: string): Promise<GatewayModel | null> {
    const entity = await this.gps.findByFactoryId(factoryId);
    if (!entity) {
      return null;
    }
    return GatewaysMapper.toModel(entity);
  }

  async updateGateway(input: UpdateGatewayInput): Promise<GatewayModel> {
    this.logger.log(`Updating gateway: ${input.gatewayId}`);
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
    this.logger.log(`Deleting gateway: ${input.gatewayId}`);
    const result = await this.gps.deleteGateway({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
    });
    if (!result) {
      throw new NotFoundException('Gateway not found');
    }

    this.eventEmitter.emit('gateway.decommissioned', {
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
    });
    this.logger.log(
      `Emitted decommissioning event for gateway ${input.gatewayId}`,
    );
  }

  async updateGatewayRuntimeStatus(
    gatewayId: string,
    status: GatewayStatus,
    lastSeenAt: Date,
  ): Promise<boolean> {
    const entity = await this.gps.updateGatewayRuntimeStatus({
      gatewayId,
      status,
      lastSeenAt,
    });

    return entity !== null;
  }
}
