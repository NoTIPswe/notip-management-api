import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AlertsPersistenceService } from './alerts.persistence.service';
import { SetGatewayAlertsConfigInput } from './interfaces/controller-service.interfaces';
import { AlertsMapper } from './alerts.mapper';
import { AlertsConfigModel } from './models/alerts.config.model';
import { GatewaysService } from 'src/gateways/gateways.service';

@Injectable()
export class AlertsService {
  constructor(
    private readonly aps: AlertsPersistenceService,
    private readonly gatewayService: GatewaysService,
  ) {}

  async setGatewayAlertsConfig(
    input: SetGatewayAlertsConfigInput,
  ): Promise<AlertsConfigModel> {
    const gateway = await this.gatewayService.findById(input.gatewayId);
    if (!gateway) throw new NotFoundException('Gateway not found');
    if (gateway.tenantId !== input.tenantId)
      throw new ForbiddenException('Gateway does not belong to your tenant');

    const entity = await this.aps.setGatewayAlertsConfig({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
      gatewayTimeoutMs: input.gatewayTimeoutMs,
    });

    return AlertsMapper.toAlertsConfigModel([entity]);
  }

  async getAlertsConfig(): Promise<AlertsConfigModel> {
    const entities = await this.aps.getAlertsConfig('');
    return AlertsMapper.toAlertsConfigModel(entities);
  }
}
