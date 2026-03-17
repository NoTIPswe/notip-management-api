import { Module } from '@nestjs/common';
import { CostsService } from './costs.service';
import { CostsController } from './costs.controller';

@Module({
  providers: [CostsService],
  controllers: [CostsController]
})
export class CostsModule {}
