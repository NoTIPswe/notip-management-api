import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ThresholdsPersistenceService } from './thresholds.persistence.service';
import {
  DeleteThresholdSensorInput,
  DeleteThresholdTypeInput,
  GetThresholdsInput,
  SetThresholdDefaultTypeInput,
  SetThresholdSensorInput,
} from '../interfaces/controller-service.interfaces';
import { ThresholdModel } from '../models/threshold.model';
import { ThresholdsMapper } from '../thresholds.mapper';

@Injectable()
export class ThresholdsService {
  constructor(private readonly tps: ThresholdsPersistenceService) {}

  async getThresholds(input: GetThresholdsInput): Promise<ThresholdModel[]> {
    const entities = await this.tps.getThresholds({
      tenantId: input.tenantId,
    });
    return entities.map((entity) => ThresholdsMapper.toModel(entity));
  }

  async setThresholdDefaultType(
    input: SetThresholdDefaultTypeInput,
  ): Promise<ThresholdModel> {
    const sensorType = this.ensureSensorType(input.sensorType);
    this.validateValueRange(input.minValue, input.maxValue);

    const entity = await this.tps.setThresholdDefaultType({
      tenantId: input.tenantId,
      sensorType,
      minValue: input.minValue,
      maxValue: input.maxValue,
    });
    return ThresholdsMapper.toModel(entity);
  }

  async setThresholdSensor(
    input: SetThresholdSensorInput,
  ): Promise<ThresholdModel> {
    this.validateValueRange(input.minValue, input.maxValue);
    const sensorId = this.ensureSensorId(input.sensorId);
    const entity = await this.tps.setThresholdSensor({
      tenantId: input.tenantId,
      sensorId,
      minValue: input.minValue,
      maxValue: input.maxValue,
    });
    return ThresholdsMapper.toModel(entity);
  }

  async deleteSensorThreshold(
    input: DeleteThresholdSensorInput,
  ): Promise<void> {
    const sensorId = this.ensureSensorId(input.sensorId);
    const deleted = await this.tps.deleteSensorThreshold({
      tenantId: input.tenantId,
      sensorId,
    });
    if (!deleted) {
      throw new NotFoundException('Sensor threshold not found');
    }
  }

  async deleteThresholdType(input: DeleteThresholdTypeInput): Promise<void> {
    const sensorType = this.ensureSensorType(input.sensorType);
    const deleted = await this.tps.deleteThresholdType({
      tenantId: input.tenantId,
      sensorType,
    });
    if (!deleted) {
      throw new NotFoundException('Threshold type not found');
    }
  }

  private ensureSensorType(sensorType: string): string {
    const normalized = sensorType?.trim();
    if (!normalized) {
      throw new BadRequestException('sensorType is required');
    }
    return normalized;
  }

  private ensureSensorId(sensorId: string): string {
    const normalized = sensorId?.trim();
    if (!normalized) {
      throw new BadRequestException('sensorId is required');
    }
    return normalized;
  }

  private validateValueRange(minValue: number, maxValue: number): void {
    if (
      typeof minValue !== 'number' ||
      typeof maxValue !== 'number' ||
      Number.isNaN(minValue) ||
      Number.isNaN(maxValue) ||
      minValue >= maxValue
    ) {
      throw new BadRequestException('minValue must be less than maxValue');
    }
  }
}
