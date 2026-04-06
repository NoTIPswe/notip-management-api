import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsController } from './controller/alerts.controller';
import { AlertsService } from './services/alerts.service';
import { AlertsPersistenceService } from './services/alerts.persistence.service';
import { AlertConfigNatsResponderService } from './services/alert-config-nats-responder.service';
import { GatewaysModule } from '../gateways/gateways.module';
import { AlertsEntity } from './entities/alerts.entity';
import { AlertsConfigEntity } from './entities/alerts.config.entity';

@Module({
  imports: [
    GatewaysModule,
    TypeOrmModule.forFeature([AlertsEntity, AlertsConfigEntity]),
  ],
  controllers: [AlertsController],
  providers: [
    AlertsService,
    AlertsPersistenceService,
    AlertConfigNatsResponderService,
  ],

  exports: [AlertsPersistenceService],
})
export class AlertsModule {}
