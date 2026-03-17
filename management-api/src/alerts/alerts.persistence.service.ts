import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AlertsConfigEntity } from './entities/alerts.config.entity';
import { AlertsEntity } from './entities/alerts.entity';
import { SetGatewayAlertsConfigPersistenceInput } from './interfaces/service-persistence.interface';

@Injectable()
export class AlertsPersistenceService {
  constructor(
    private readonly r: Repository<AlertsEntity>,
    private readonly rac: Repository<AlertsConfigEntity>,
  ) {}
  async setGatewayAlertsConfig(
    input: SetGatewayAlertsConfigPersistenceInput,
  ): Promise<AlertsConfigEntity> {
    const alertConfig = await this.rac.findOneBy({ tenantId: input. });
  }
}
