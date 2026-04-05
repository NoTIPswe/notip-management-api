import {
  BadRequestException,
  Injectable,
  Logger,
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
import { JetStreamClient } from '../nats/jetstream.client';

@Injectable()
export class CommandService {
  private readonly logger = new Logger(CommandService.name);

  constructor(
    private readonly cps: CommandPersistenceService,
    private readonly gatewaysService: GatewaysService,
    private readonly jetStreamClient: JetStreamClient,
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
      requestedSendFrequencyMs: input.sendFrequencyMs,
      requestedStatus: input.status,
    });

    const model = CommandMapper.toModel(entity);
    await this.publishToNats(model, 'config_update', {
      send_frequency_ms: input.sendFrequencyMs,
      status: input.status,
    });

    return model;
  }

  async sendFirmware(input: SendFirmwareCommandInput): Promise<CommandModel> {
    await this.ensureGatewayOwnership(input.tenantId, input.gatewayId);
    const entity = await this.cps.queueCommand({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
      type: CommandType.FIRMWARE,
      status: CommandStatus.QUEUED,
      issuedAt: new Date(),
      requestedFirmwareVersion: input.firmwareVersion,
    });

    const model = CommandMapper.toModel(entity);
    await this.publishToNats(model, 'firmware_push', {
      firmware_version: input.firmwareVersion,
      download_url: input.downloadUrl,
    });

    return model;
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

  private async publishToNats(
    model: CommandModel,
    type: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const subject = `command.gw.${model.tenantId}.${model.gatewayId}`;
    const natsPayload = {
      command_id: model.id,
      type,
      payload,
      issued_at: model.issuedAt.toISOString(),
    };

    try {
      await this.jetStreamClient.publish(
        subject,
        Buffer.from(JSON.stringify(natsPayload)),
      );
      this.logger.log(`Published command ${model.id} to NATS on ${subject}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish command ${model.id} to NATS`,
        error as Error,
      );
      // We don't throw here to avoid failing the request if NATS is down,
      // as the command is already queued in the DB.
      // Depending on requirements, you might want to throw or handle this differently.
    }
  }

  private async ensureGatewayOwnership(
    tenantId: string,
    gatewayId: string,
  ): Promise<void> {
    await this.gatewaysService.findById({ tenantId, gatewayId });
  }
}
