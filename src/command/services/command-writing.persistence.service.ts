import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommandEntity } from '../entities/command.entity';
import { CommandStatus } from '../enums/command-status.enum';
import { CommandType } from '../enums/command-type.enum';
import { UpdateCommandStatusPersistenceInput } from '../interfaces/service-persistence.interfaces';
import { GatewayEntity } from '../../gateways/entities/gateway.entity';
import { GatewayStatus } from '../../gateways/enums/gateway.enum';
import { DEFAULT_GATEWAY_SEND_FREQUENCY_MS } from '../../gateways/gateway.constants';

@Injectable()
export class CommandWritingPersistenceService {
  constructor(
    @InjectRepository(CommandEntity)
    private readonly r: Repository<CommandEntity>,
    @InjectRepository(GatewayEntity)
    private readonly gatewaysRepository: Repository<GatewayEntity>,
  ) {}

  async updateStatus(
    input: UpdateCommandStatusPersistenceInput,
  ): Promise<CommandEntity | null> {
    const entity = await this.r.findOne({ where: { id: input.commandId } });
    if (!entity) {
      return null;
    }
    entity.status = input.status;
    entity.ackReceivedAt = input.timestamp;
    return this.r.save(entity);
  }

  async applyAckedCommandEffects(command: CommandEntity): Promise<void> {
    if (command.status !== CommandStatus.ACK) {
      return;
    }

    const gateway = await this.gatewaysRepository.findOne({
      where: { id: command.gatewayId },
      relations: ['metadata'],
    });
    if (!gateway) {
      return;
    }

    let changed = false;

    if (command.type === CommandType.CONFIG) {
      if (typeof command.requestedSendFrequencyMs === 'number') {
        if (!gateway.metadata) {
          gateway.metadata = {
            gatewayId: gateway.id,
            gateway,
            status: GatewayStatus.GATEWAY_OFFLINE,
            sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
          } as GatewayEntity['metadata'];
        }
        gateway.metadata.sendFrequencyMs = command.requestedSendFrequencyMs;
        changed = true;
      }

      const mappedStatus = this.mapCommandGatewayStatus(
        command.requestedStatus,
      );
      if (mappedStatus) {
        if (!gateway.metadata) {
          gateway.metadata = {
            gatewayId: gateway.id,
            gateway,
            status: GatewayStatus.GATEWAY_OFFLINE,
            sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
          } as GatewayEntity['metadata'];
        }
        gateway.metadata.status = mappedStatus;
        changed = true;
      }
    }

    if (
      command.type === CommandType.FIRMWARE &&
      typeof command.requestedFirmwareVersion === 'string' &&
      command.requestedFirmwareVersion.trim().length > 0
    ) {
      gateway.firmwareVersion = command.requestedFirmwareVersion;
      changed = true;
    }

    if (changed) {
      await this.gatewaysRepository.save(gateway);
    }
  }

  private mapCommandGatewayStatus(status: string | null): GatewayStatus | null {
    if (typeof status !== 'string' || status.trim().length === 0) {
      return null;
    }

    const normalized = status.trim().toLowerCase();
    if (normalized === 'online' || normalized === 'gateway_online') {
      return GatewayStatus.GATEWAY_ONLINE;
    }
    if (
      normalized === 'paused' ||
      normalized === 'suspended' ||
      normalized === 'gateway_suspended'
    ) {
      return GatewayStatus.GATEWAY_SUSPENDED;
    }
    if (normalized === 'offline' || normalized === 'gateway_offline') {
      return GatewayStatus.GATEWAY_OFFLINE;
    }

    return null;
  }
}
