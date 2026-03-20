import { Module } from '@nestjs/common';
import { CostsController } from './controller/costs.controller';
import { CostsService } from './services/costs.service';
import { CostsPersistenceService } from './services/costs.persistence.service';

@Module({
  controllers: [CostsController],
  providers: [CostsService, CostsPersistenceService],
})
export class CostsModule {}
