import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandController } from './controller/command.controller';
import { CommandService } from './services/command.service';
import { CommandPersistenceService } from './services/command.persistence.service';
import { CommandEntity } from './entities/command.entity';
import { GatewaysModule } from '../gateways/gateways.module';
import { CommandWritingPersistenceService } from './services/command-writing.persistence.service';
import { CommandsAckConsumer } from './services/commands-ack.consumer';
import { JetStreamClient } from './nats/jetstream.client';
import { MockJetStreamClient } from './nats/mock-jetstream.client';
import { NatsJetStreamClient } from './nats/nats-jetstream.client';

@Module({
  imports: [GatewaysModule, TypeOrmModule.forFeature([CommandEntity])],
  controllers: [CommandController],
  providers: [
    CommandService,
    CommandPersistenceService,
    CommandWritingPersistenceService,
    CommandsAckConsumer,
    {
      provide: JetStreamClient,
      useClass:
        process.env.MOCK_NATS === 'false'
          ? NatsJetStreamClient
          : MockJetStreamClient,
    },
  ],
})
export class CommandModule {}
