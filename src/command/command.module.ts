import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandController } from './controller/command.controller';
import { CommandService } from './services/command.service';
import { CommandPersistenceService } from './services/command.persistence.service';
import { CommandEntity } from './entities/command.entity';
import { GatewaysModule } from '../gateways/gateways.module';
import { CommandWritingPersistenceService } from './services/command-writing.persistence.service';
import { CommandsAckConsumer } from './services/commands-ack.consumer';
import { GatewayEntity } from '../gateways/entities/gateway.entity';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [
    forwardRef(() => GatewaysModule),
    TypeOrmModule.forFeature([CommandEntity, GatewayEntity]),
    NatsModule,
  ],
  controllers: [CommandController],
  providers: [
    CommandService,
    CommandPersistenceService,
    CommandWritingPersistenceService,
    CommandsAckConsumer,
  ],
  exports: [CommandPersistenceService],
})
export class CommandModule {}
