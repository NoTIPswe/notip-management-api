import { GatewayEntity } from './entities/gateway.entity';
import { GatewayModel } from './models/gateway.model';
import { GatewayResponseDto } from './dto/gateway.response.dto';
import { UpdateGatewayResponseDto } from './dto/update-gateway.response.dto';
import { GatewayStatus } from './enums/gateway.enum';
import { DEFAULT_GATEWAY_SEND_FREQUENCY_MS } from './gateway.constants';

export class GatewaysMapper {
  static toModel(entity: GatewayEntity): GatewayModel {
    return {
      id: entity.id,
      name: entity.metadata?.name ?? '',
      status: entity.metadata?.status ?? GatewayStatus.GATEWAY_OFFLINE,
      lastSeenAt: entity.metadata?.lastSeenAt ?? null,
      sendFrequencyMs:
        entity.metadata?.sendFrequencyMs ?? DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
      factoryKey: entity.factoryKeyHash ?? '',
      factoryId: entity.factoryId,
      createdAt: entity.createdAt,
      firmwareVersion: entity.firmwareVersion,
      model: entity.model,
      tenantId: entity.tenantId ?? entity.tenant?.id ?? '',
      provisioned: entity.provisioned,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseDto(model: GatewayModel): GatewayResponseDto {
    return {
      id: model.id,
      name: model.name,
      status: model.status,
      lastSeenAt: model.lastSeenAt ? model.lastSeenAt.toISOString() : null,
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
      updatedAt: (model.updatedAt ?? new Date()).toISOString(),
    };
  }
}
