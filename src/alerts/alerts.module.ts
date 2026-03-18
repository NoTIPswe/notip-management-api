import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsPersistenceService } from './alerts.persistence.service';
import { GatewaysModule } from 'src/gateways/gateways.module';
import { AlertsEntity } from './entities/alerts.entity';
import { AlertsConfigEntity } from './entities/alerts.config.entity';

@Module({
  imports: [GatewaysModule, TypeOrmModule.forFeature([AlertsEntity, AlertsConfigEntity])],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsPersistenceService]
})
export class AlertsModule {}
