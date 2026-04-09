import { Module } from '@nestjs/common';
import { CostsController } from './controller/costs.controller';
import { CostsService } from './services/costs.service';
import { CostsPersistenceService } from './services/costs.persistence.service';
import { CommandModule } from '../command/command.module';
import { AlertsModule } from '../alerts/alerts.module';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [CommandModule, AlertsModule, NatsModule],
  controllers: [CostsController],
  providers: [CostsService, CostsPersistenceService],
})
export class CostsModule {}
