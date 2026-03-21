import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommandPersistenceService } from './command.persistence.service';
import {
  GetCommandStatusInput,
  SendConfigCommandInput,
  SendFirmwareCommandInput,
} from '../interfaces/controller-service.interfaces';
import { CommandModel } from '../models/command.model';
import { CommandType } from '../enums/command-type.enum';
import { CommandStatus } from '../enums/command-status.enum';
import { CommandMapper } from '../command.mapper';
import { GatewaysService } from '../../gateways/services/gateways.service';

@Injectable()
export class CommandService {
  constructor(
    private readonly cps: CommandPersistenceService,
    private readonly gatewaysService: GatewaysService,
  ) {}

  async sendConfig(input: SendConfigCommandInput): Promise<CommandModel> {
    const hasFrequency = typeof input.sendFrequencyMs === 'number';
    const hasStatus =
      typeof input.status === 'string' && input.status.trim().length > 0;
    if (!hasFrequency && !hasStatus) {
      throw new BadRequestException(
        'At least one configuration parameter must be provided',
      );
    }

    await this.ensureGatewayOwnership(input.tenantId, input.gatewayId);
    const entity = await this.cps.queueCommand({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
      type: CommandType.CONFIG,
      status: CommandStatus.QUEUED,
      issuedAt: new Date(),
    });
    return CommandMapper.toModel(entity);
  }

  async sendFirmware(input: SendFirmwareCommandInput): Promise<CommandModel> {
    await this.ensureGatewayOwnership(input.tenantId, input.gatewayId);
    const entity = await this.cps.queueCommand({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
      type: CommandType.FIRMWARE,
      status: CommandStatus.QUEUED,
      issuedAt: new Date(),
    });
    return CommandMapper.toModel(entity);
  }

  async getStatus(input: GetCommandStatusInput): Promise<CommandModel> {
    const entity = await this.cps.findCommand({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
      commandId: input.commandId,
    });
    if (!entity) {
      throw new NotFoundException('Command not found');
    }
    return CommandMapper.toModel(entity);
  }

  private async ensureGatewayOwnership(
    tenantId: string,
    gatewayId: string,
  ): Promise<void> {
    await this.gatewaysService.findById({ tenantId, gatewayId });
  }
}
