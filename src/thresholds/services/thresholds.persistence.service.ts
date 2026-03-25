import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
    let entity = await this.r.findOne({
      where: {
        tenantId: input.tenantId,
        sensorType: input.sensorType,
        sensorId: IsNull(),
      },
    });
    if (entity) {
      entity.minValue = input.minValue;
      entity.maxValue = input.maxValue;
      await this.r.save(entity);
    } else {
      entity = this.r.create({
        tenantId: input.tenantId,
        sensorType: input.sensorType,
        sensorId: null,
        minValue: input.minValue,
        maxValue: input.maxValue,
      });
      await this.r.save(entity);
    }
    return entity;
  }

  async setThresholdSensor(
    input: SetThresholdSensorPersistenceInput,
  ): Promise<ThresholdEntity> {
    let entity = await this.r.findOne({
      where: {
        tenantId: input.tenantId,
        sensorId: input.sensorId,
      },
    });
    if (entity) {
      entity.minValue = input.minValue;
      entity.maxValue = input.maxValue;
      if (input.sensorType !== undefined) {
        entity.sensorType = input.sensorType;
      }
      await this.r.save(entity);
    } else {
      entity = this.r.create({
        tenantId: input.tenantId,
        sensorId: input.sensorId,
        minValue: input.minValue,
        maxValue: input.maxValue,
        sensorType: input.sensorType,
      });
      await this.r.save(entity);
    }
    return entity;
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
