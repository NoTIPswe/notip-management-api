import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { CommandPersistenceService } from './command.persistence.service';

@Module({
  controllers: [CommandController],
  providers: [CommandService, CommandPersistenceService],
})
export class CommandModule {}
