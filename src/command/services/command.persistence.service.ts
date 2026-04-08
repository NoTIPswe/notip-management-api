import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommandEntity } from '../entities/command.entity';
import {
  GetCommandPersistenceInput,
  QueueCommandPersistenceInput,
} from '../interfaces/service-persistence.interfaces';

@Injectable()
export class CommandPersistenceService {
  constructor(
    @InjectRepository(CommandEntity)
    private readonly r: Repository<CommandEntity>,
  ) {}

  async queueCommand(
    input: QueueCommandPersistenceInput,
  ): Promise<CommandEntity> {
    const entity = this.r.create({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
      type: input.type,
      status: input.status,
      issuedAt: input.issuedAt,
      ackReceivedAt: null,
      requestedSendFrequencyMs: input.requestedSendFrequencyMs ?? null,
      requestedStatus: input.requestedStatus ?? null,
      requestedFirmwareVersion: input.requestedFirmwareVersion ?? null,
    });
    return this.r.save(entity);
  }

  async findCommand(
    input: GetCommandPersistenceInput,
  ): Promise<CommandEntity | null> {
    return this.r.findOne({
      where: {
        id: input.commandId,
        tenantId: input.tenantId,
        gatewayId: input.gatewayId,
      },
    });
  }

  async countCommands(tenantId: string): Promise<number> {
    return this.r.count({
      where: { tenantId },
    });
  }
}
