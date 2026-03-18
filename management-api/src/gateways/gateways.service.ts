import { Injectable } from '@nestjs/common';
import { GatewayModel } from './models/gateway.model';
import { GatewaysPersistenceService } from './gateways.persistence.service';

@Injectable()
export class GatewaysService {
  constructor(private readonly gps: GatewaysPersistenceService) {}

  async findById(gatewayId: string): Promise<GatewayModel | null> {
    const entity = await this.gps.findById(gatewayId);
    if (!entity) return null;
    return {
      id: entity.id,
      name: entity.metadata?.name ?? '',
      status: entity.metadata?.status,
      lastSeenAt: entity.metadata?.lastSeenAt ?? null,
      sendFrequencyMs: entity.metadata?.sendFrequencyMs ?? null,
      factoryKey: entity.factoryKeyHash ?? '',
      factoryId: entity.factoryId,
      createdAt: entity.createdAt,
      firmwareVersion: entity.firmwareVersion,
      model: entity.model,
      tenantId: entity.tenantId,
      provisioned: entity.provisioned,
    };
  }
}
