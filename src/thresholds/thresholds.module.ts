import { Module } from '@nestjs/common';
import { ThresholdsController } from './thresholds.controller';
import { ThresholdsService } from './thresholds.service';
import { ThresholdsPersistenceService } from './thresholds.persistence.service';

@Module({
  controllers: [ThresholdsController],
  providers: [ThresholdsService, ThresholdsPersistenceService]
})
export class ThresholdsModule {}
