import { Injectable } from '@nestjs/common';
import { AlertsConfigEntity } from './entities/alerts.config.entity';
import { SetGatewayAlertsConfigPersistenceInput } from './interfaces/service-persistence.interface';
import { AlertsEntity } from './entities/alerts.entity';
import { Repository } from 'typeorm';

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
      where: { gatewayId: input.gatewayId },
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
}
