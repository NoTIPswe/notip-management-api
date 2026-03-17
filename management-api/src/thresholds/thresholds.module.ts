import { Module } from '@nestjs/common';
import { ThresholdsService } from './thresholds.service';
import { ThresholdsController } from './thresholds.controller';

@Module({
  providers: [ThresholdsService],
  controllers: [ThresholdsController]
})
export class ThresholdsModule {}
