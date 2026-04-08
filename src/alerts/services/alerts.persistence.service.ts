import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AlertsConfigEntity } from '../entities/alerts.config.entity';
import {
  GetAlertsPersistenceInput,
  SetAlertsConfigDefaultPersistenceInput,
  SetGatewayAlertsConfigPersistenceInput,
} from '../interfaces/service-persistence.interface';
import { AlertsEntity } from '../entities/alerts.entity';
import {
  Between,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

@Injectable()
export class AlertsPersistenceService {
  constructor(
    @InjectRepository(AlertsEntity)
    private readonly r: Repository<AlertsEntity>,
    @InjectRepository(AlertsConfigEntity)
    private readonly rac: Repository<AlertsConfigEntity>,
  ) {}

  async setGatewayAlertsConfig(
    input: SetGatewayAlertsConfigPersistenceInput,
  ): Promise<AlertsConfigEntity> {
    await this.rac.upsert(
      {
        tenantId: input.tenantId,
        gatewayId: input.gatewayId,
        gatewayTimeoutMs: input.gatewayTimeoutMs,
      },
      ['tenantId', 'gatewayId'],
    );
    return (await this.rac.findOne({
      where: { gatewayId: input.gatewayId, tenantId: input.tenantId },
    })) as AlertsConfigEntity;
  }

  async deleteGatewayAlertsConfig(
    tenantId: string,
    gatewayId: string,
  ): Promise<boolean> {
    const result = await this.rac.delete({ tenantId, gatewayId });
    return (result.affected ?? 0) > 0;
  }

  async setDefaultAlertsConfig(
    input: SetAlertsConfigDefaultPersistenceInput,
  ): Promise<AlertsConfigEntity> {
    const defaults = await this.rac.find({
      where: { tenantId: input.tenantId, gatewayId: IsNull() },
      order: { updatedAt: 'DESC' },
    });

    if (defaults.length === 0) {
      const created = this.rac.create({
        tenantId: input.tenantId,
        gatewayId: null,
        gatewayTimeoutMs: input.defaultTimeoutMs,
      });
      return this.rac.save(created);
    }

    const [latest, ...duplicates] = defaults;
    latest.gatewayTimeoutMs = input.defaultTimeoutMs;
    const saved = await this.rac.save(latest);

    if (duplicates.length > 0) {
      await this.rac.delete(duplicates.map((row) => row.id));
    }

    return saved;
  }

  async getAlertsConfig(tenantId: string): Promise<AlertsConfigEntity[]> {
    return this.rac.find({
      where: {
        tenant: { id: tenantId },
      },
      relations: ['gateway'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findAllAlertConfigs(): Promise<AlertsConfigEntity[]> {
    return this.rac.find();
  }

  async getAlerts(input: GetAlertsPersistenceInput): Promise<AlertsEntity[]> {
    const createdAtFilter =
      input.from && input.to
        ? Between(new Date(input.from), new Date(input.to))
        : input.from
          ? MoreThanOrEqual(new Date(input.from))
          : input.to
            ? LessThanOrEqual(new Date(input.to))
            : undefined;

    return this.r.find({
      where: {
        tenantId: input.tenantId,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        ...(input.gatewayId ? { gatewayId: input.gatewayId } : {}),
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async countAlerts(tenantId: string): Promise<number> {
    return this.r.count({
      where: { tenantId },
    });
  }

  async saveAlert(alert: Partial<AlertsEntity>): Promise<AlertsEntity> {
    const entity = this.r.create(alert);
    return this.r.save(entity);
  }

  async findAllAlertsConfigs(): Promise<AlertsConfigEntity[]> {
    return this.rac.find();
  }
}
