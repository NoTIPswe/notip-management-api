import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, QueryDeepPartialEntity } from 'typeorm';
import { ThresholdEntity } from '../entities/threshold.entity';
import {
  DeleteThresholdSensorPersistenceInput,
  DeleteThresholdTypePersistenceInput,
  GetThresholdsPersistenceInput,
  SetThresholdDefaultTypePersistenceInput,
  SetThresholdSensorPersistenceInput,
} from '../interfaces/service-persistence.interfaces';

@Injectable()
export class ThresholdsPersistenceService {
  constructor(
    @InjectRepository(ThresholdEntity)
    private readonly r: Repository<ThresholdEntity>,
  ) {}

  async getThresholds(
    input: GetThresholdsPersistenceInput,
  ): Promise<ThresholdEntity[]> {
    return this.r.find({
      where: { tenantId: input.tenantId },
      order: { updatedAt: 'DESC' },
    });
  }

  async setThresholdDefaultType(
    input: SetThresholdDefaultTypePersistenceInput,
  ): Promise<ThresholdEntity> {
    await this.r.upsert(
      {
        tenantId: input.tenantId,
        sensorType: input.sensorType,
        sensorId: null,
        minValue: input.minValue,
        maxValue: input.maxValue,
      },
      {
        conflictPaths: ['tenantId', 'sensorType'],
        skipUpdateIfNoValuesChanged: true,
      },
    );

    return this.r.findOneOrFail({
      where: {
        tenantId: input.tenantId,
        sensorType: input.sensorType,
        sensorId: IsNull(),
      },
    });
  }

  async setThresholdSensor(
    input: SetThresholdSensorPersistenceInput,
  ): Promise<ThresholdEntity> {
    const payload: QueryDeepPartialEntity<ThresholdEntity> = {
      tenantId: input.tenantId,
      sensorId: input.sensorId,
      minValue: input.minValue,
      maxValue: input.maxValue,
    };

    if (input.sensorType !== undefined) {
      payload.sensorType = input.sensorType;
    }

    await this.r.upsert(payload, {
      conflictPaths: ['tenantId', 'sensorId'],
      skipUpdateIfNoValuesChanged: true,
    });

    return this.r.findOneOrFail({
      where: {
        tenantId: input.tenantId,
        sensorId: input.sensorId,
      },
    });
  }

  async deleteSensorThreshold(
    input: DeleteThresholdSensorPersistenceInput,
  ): Promise<boolean> {
    const result = await this.r.delete({
      tenantId: input.tenantId,
      sensorId: input.sensorId,
    });
    return (result.affected ?? 0) > 0;
  }

  async deleteThresholdType(
    input: DeleteThresholdTypePersistenceInput,
  ): Promise<boolean> {
    const result = await this.r.delete({
      tenantId: input.tenantId,
      sensorType: input.sensorType,
      sensorId: IsNull(),
    });
    return (result.affected ?? 0) > 0;
  }
}
