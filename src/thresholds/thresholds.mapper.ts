import { ThresholdEntity } from './entities/threshold.entity';
import { ThresholdModel } from './models/threshold.model';
import { ThresholdResponseDto } from './dto/threshold.response.dto';
import { SetThresholdDefaultTypeResponseDto } from './dto/set-threshold-default-type.response.dto';
import { SetThresholdSensorResponseDto } from './dto/set-threshold-sensor.response.dto';

export class ThresholdsMapper {
  static toModel(entity: ThresholdEntity): ThresholdModel {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      sensorType: entity.sensorType ?? null,
      sensorId: entity.sensorId ?? null,
      minValue: entity.minValue,
      maxValue: entity.maxValue,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toThresholdResponseDto(model: ThresholdModel): ThresholdResponseDto {
    return {
      sensorType: model.sensorType ?? null,
      sensorId: model.sensorId ?? null,
      minValue: model.minValue,
      maxValue: model.maxValue,
      updatedAt: model.updatedAt,
    };
  }

  static toSetThresholdDefaultTypeResponseDto(
    model: ThresholdModel,
  ): SetThresholdDefaultTypeResponseDto {
    return {
      sensorType: model.sensorType ?? null,
      minValue: model.minValue,
      maxValue: model.maxValue,
      updatedAt: model.updatedAt,
    };
  }

  static toSetThresholdSensorResponseDto(
    model: ThresholdModel,
  ): SetThresholdSensorResponseDto {
    return {
      sensorId: model.sensorId ?? null,
      sensorType: model.sensorType ?? null,
      minValue: model.minValue,
      maxValue: model.maxValue,
      updatedAt: model.updatedAt,
    };
  }
}
