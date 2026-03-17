import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsPersistenceService } from './alerts.persistence.service';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService, AlertsPersistenceService]
})
export class AlertsModule {}
