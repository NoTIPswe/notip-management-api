import { Injectable } from '@nestjs/common';
import { AlertsConfigEntity } from '../entities/alerts.config.entity';
import {
  GetAlertsPersistenceInput,
  SetAlertsConfigDefaultPersistenceInput,
  SetGatewayAlertsConfigPersistenceInput,
} from '../interfaces/service-persistence.interface';
import { AlertsEntity } from '../entities/alerts.entity';
import { Between, IsNull, Repository } from 'typeorm';

@Injectable()
export class AlertsPersistenceService {
  constructor(
    private readonly r: Repository<AlertsEntity>,
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
      ['gatewayId'],
    );
    return (await this.rac.findOne({
      where: { gatewayId: input.gatewayId, tenantId: input.tenantId },
    })) as AlertsConfigEntity;
  }

  async setDefaultAlertsConfig(
    input: SetAlertsConfigDefaultPersistenceInput,
  ): Promise<AlertsConfigEntity> {
    await this.rac.upsert(
      {
        tenantId: input.tenantId,
        gatewayId: null,
        gatewayTimeoutMs: input.defaultTimeoutMs,
      },
      ['tenantId'],
    );
    return (await this.rac.findOne({
      where: { tenantId: input.tenantId, gatewayId: IsNull() },
    })) as AlertsConfigEntity;
  }

  async getAlertsConfig(tenantId: string): Promise<AlertsConfigEntity[]> {
    return this.rac.find({
      where: {
        tenant: { id: tenantId },
      },
      relations: ['gateway'],
    });
  }

  async getAlerts(input: GetAlertsPersistenceInput): Promise<AlertsEntity[]> {
    return this.r.find({
      where: {
        tenantId: input.tenantId,
        createdAt: Between(new Date(input.from), new Date(input.to)),
        ...(input.gatewayId ? { gatewayId: input.gatewayId } : {}),
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
