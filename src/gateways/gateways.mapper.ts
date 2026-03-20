import { GatewayEntity } from '../common/entities/gateway.entity';
import { GatewayModel } from './models/gateway.model';
import { GatewayResponseDto } from './dto/gateway.response.dto';
import { UpdateGatewayResponseDto } from './dto/update-gateway.response.dto';

export class GatewaysMapper {
  static toModel(entity: GatewayEntity): GatewayModel {
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
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseDto(model: GatewayModel): GatewayResponseDto {
    return {
      id: model.id,
      name: model.name,
      status: model.status,
      lastSeenAt: model.lastSeenAt,
      provisioned: model.provisioned,
      firmwareVersion: model.firmwareVersion,
      sendFrequencyMs: model.sendFrequencyMs,
    };
  }

  static toUpdateResponseDto(model: GatewayModel): UpdateGatewayResponseDto {
    return {
      id: model.id,
      name: model.name,
      status: model.status,
      updatedAt: model.updatedAt ?? new Date(),
    };
  }
}
