import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AlertsPersistenceService } from './alerts.persistence.service';
import { SetGatewayAlertsConfigInput } from './interfaces/controller-service.interfaces';
import { AlertsModel } from './models/alerts.model';
import { AlertsMapper } from './alerts.mapper';
import { AlertsConfigModel } from './models/alerts.config.model';

@Injectable()
export class AlertsService {
  constructor(private readonly aps: AlertsPersistenceService) {}

  async setGatewayAlertsConfig(
    tenantId: string,
    gatewayId: string,
    input: SetGatewayAlertsConfigInput,
  ): Promise<AlertsConfigModel> {
    const gateway = await this.gatewayService.findById(gatewayId);
    if (!gateway) throw new NotFoundException('Gateway not found');
    if (gateway.tenantId !== tenantId)
      throw new ForbiddenException('Gateway does not belong to your tenant');

    const entity = await this.aps.setGatewayAlertsConfig({
      tenantId,
      gatewayId,
      gatewayTimeoutMs: input.gatewayTimeoutMs,
    });

    return AlertsMapper.toAlertsConfigModel([entity]);
  }

  async getAlertsConfig(): Promise<AlertsConfigModel> {
    const entities = await this.aps.getAlertsConfig();
    return AlertsMapper.toAlertsConfigModel(entities);
  }
}
