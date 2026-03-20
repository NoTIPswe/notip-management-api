import { Module } from '@nestjs/common';
import { CommandController } from './controller/command.controller';
import { CommandService } from './services/command.service';
import { CommandPersistenceService } from './services/command.persistence.service';

@Module({
  controllers: [CommandController],
  providers: [CommandService, CommandPersistenceService],
})
export class CommandModule {}
