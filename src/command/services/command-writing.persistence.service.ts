import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommandEntity } from '../entities/command.entity';
import { UpdateCommandStatusPersistenceInput } from '../interfaces/service-persistence.interfaces';

@Injectable()
export class CommandWritingPersistenceService {
  constructor(
    @InjectRepository(CommandEntity)
    private readonly r: Repository<CommandEntity>,
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
}
