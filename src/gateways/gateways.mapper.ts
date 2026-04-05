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
    const dto = new GatewayResponseDto();
    dto.id = model.id;
    dto.name = model.name;
    dto.status = model.status;
    dto.lastSeenAt = model.lastSeenAt ? model.lastSeenAt.toISOString() : null;
    dto.provisioned = model.provisioned;
    dto.firmwareVersion = model.firmwareVersion;
    dto.sendFrequencyMs = model.sendFrequencyMs;
    return dto;
  }

  static toUpdateResponseDto(model: GatewayModel): UpdateGatewayResponseDto {
    const dto = new UpdateGatewayResponseDto();
    dto.id = model.id;
    dto.name = model.name;
    dto.status = model.status;
    dto.updatedAt = (model.updatedAt ?? new Date()).toISOString();
    return dto;
  }
}
