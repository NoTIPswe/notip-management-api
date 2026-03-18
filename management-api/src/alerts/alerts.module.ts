import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsPersistenceService } from './alerts.persistence.service';
import { GatewaysModule } from 'src/gateways/gateways.module';

@Module({
  imports: [GatewaysModule],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsPersistenceService]
})
export class AlertsModule {}
