import { GatewayEntity } from '../../gateways/entities/gateway.entity';
import { AddGatewayRequestDto } from './dto/add-gateway.request.dto';
import { AddGatewayResponseDto } from './dto/add-gateway.response.dto';
import { GatewayResponseDto } from './dto/gateway.response.dto';
import { AddGatewayInput } from './interfaces/controller-service.interfaces';
import { GatewayModel } from './models/gateway.model';

export class GatewaysMapper {
  static toModel(entity: GatewayEntity): GatewayModel {
    const model = new GatewayModel();
    model.id = entity.id;
    model.factoryId = entity.factoryId;
    model.factoryKeyHash = entity.factoryKeyHash ?? '';
    model.createdAt = entity.createdAt;
    model.firmwareVersion = entity.firmwareVersion;
    model.model = entity.model;
    model.tenantId = entity.tenantId ?? entity.tenant?.id ?? '';
    model.provisioned = entity.provisioned;
    return model;
  }

  static toResponseDto(model: GatewayModel): GatewayResponseDto {
    const dto = new GatewayResponseDto();
    dto.id = model.id;
    dto.tenantId = model.tenantId;
    dto.createdAt = model.createdAt.toISOString();
    dto.factoryId = model.factoryId;
    dto.model = model.model;
    dto.provisioned = model.provisioned;
    dto.firmwareVersion = model.firmwareVersion;
    return dto;
  }

  static toAddGatewayInput(dto: AddGatewayRequestDto): AddGatewayInput {
    return {
      factoryId: dto.factoryId,
      tenantId: dto.tenantId,
      factoryKey: dto.factoryKey,
      model: dto.model,
    };
  }

  static toAddGatewayResponseDto(model: GatewayModel): AddGatewayResponseDto {
    const dto = new AddGatewayResponseDto();
    dto.id = model.id;
    return dto;
  }
}
