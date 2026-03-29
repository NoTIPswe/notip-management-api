import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsController } from './controller/alerts.controller';
import { AlertsService } from './services/alerts.service';
import { AlertsPersistenceService } from './services/alerts.persistence.service';
import { AlertsNatsService } from './services/alerts.nats.service';
import { GatewaysModule } from '../gateways/gateways.module';
import { AlertsEntity } from './entities/alerts.entity';
import { AlertsConfigEntity } from './entities/alerts.config.entity';
import { CommandModule } from '../command/command.module';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [
    forwardRef(() => GatewaysModule),
    TypeOrmModule.forFeature([AlertsEntity, AlertsConfigEntity]),
    forwardRef(() => CommandModule),
    NatsModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsPersistenceService, AlertsNatsService],
  exports: [AlertsPersistenceService],
})
export class AlertsModule {}
