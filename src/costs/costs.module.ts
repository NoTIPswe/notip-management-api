import { Module } from '@nestjs/common';
import { CostsController } from './costs.controller';
import { CostsService } from './costs.service';
import { CostsPersistenceService } from './costs.persistence.service';

@Module({
  controllers: [CostsController],
  providers: [CostsService, CostsPersistenceService],
})
export class CostsModule {}
