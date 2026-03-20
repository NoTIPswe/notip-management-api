import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThresholdsController } from './controller/thresholds.controller';
import { ThresholdsService } from './services/thresholds.service';
import { ThresholdsPersistenceService } from './services/thresholds.persistence.service';
import { ThresholdEntity } from './entities/threshold.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ThresholdEntity])],
  controllers: [ThresholdsController],
  providers: [ThresholdsService, ThresholdsPersistenceService],
})
export class ThresholdsModule {}
