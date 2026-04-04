import { CommandEntity } from './entities/command.entity';
import { CommandModel } from './models/command.model';
import { CommandResponseDto } from './dto/command.response.dto';
import { CommandStatusResponseDto } from './dto/command-status.response.dto';

export class CommandMapper {
  static toModel(entity: CommandEntity): CommandModel {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      gatewayId: entity.gatewayId,
      type: entity.type,
      status: entity.status,
      issuedAt: entity.issuedAt,
      ackReceivedAt: entity.ackReceivedAt ?? null,
      createdAt: entity.createdAt,
    };
  }

  static toCommandResponseDto(model: CommandModel): CommandResponseDto {
    return {
      commandId: model.id,
      status: model.status,
      issuedAt: model.issuedAt.toISOString(),
    };
  }

  static toCommandStatusResponseDto(
    model: CommandModel,
  ): CommandStatusResponseDto {
    return {
      commandId: model.id,
      status: model.status,
      timestamp: (model.ackReceivedAt ?? model.issuedAt).toISOString(),
    };
  }
}
