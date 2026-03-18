import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AlertsPersistenceService } from './alerts.persistence.service';
import {
  GetAlertsInput,
  GetAlertsConfigInput,
  SetAlertsConfigDefaultInput,
  SetGatewayAlertsConfigInput,
} from './interfaces/controller-service.interfaces';
import { AlertsMapper } from './alerts.mapper';
import { AlertsConfigModel } from './models/alerts.config.model';
import { GatewaysService } from 'src/gateways/gateways.service';
import { AlertsConfigEntity } from './entities/alerts.config.entity';
import { AlertsModel } from './models/alerts.model';

@Injectable()
export class AlertsService {
  constructor(
    private readonly aps: AlertsPersistenceService,
    private readonly gatewayService: GatewaysService,
  ) {}

  async setGatewayAlertsConfig(
    input: SetGatewayAlertsConfigInput,
  ): Promise<AlertsConfigEntity> {
    const gateway = await this.gatewayService.findByIdUnscoped(input.gatewayId);
    if (!gateway) throw new NotFoundException('Gateway not found');
    if (gateway.tenantId !== input.tenantId)
      throw new ForbiddenException('Gateway does not belong to your tenant');

    return this.aps.setGatewayAlertsConfig({
      tenantId: input.tenantId,
      gatewayId: input.gatewayId,
      gatewayTimeoutMs: input.gatewayTimeoutMs,
    });
  }

  async setDefaultAlertsConfig(
    input: SetAlertsConfigDefaultInput,
  ): Promise<AlertsConfigEntity> {
    return this.aps.setDefaultAlertsConfig({
      tenantId: input.tenantId,
      defaultTimeoutMs: input.defaultTimeoutMs,
    });
  }

  async getAlertsConfig(input: GetAlertsConfigInput): Promise<AlertsConfigModel> {
    const entities = await this.aps.getAlertsConfig(input.tenantId);
    return AlertsMapper.toAlertsConfigModel(entities);
  }

  async getAlerts(input: GetAlertsInput): Promise<AlertsModel[]> {
    const entities = await this.aps.getAlerts({
      tenantId: input.tenantId,
      from: input.from,
      to: input.to,
      gatewayId: input.gatewayId,
    });
    return entities.map(AlertsMapper.toAlertsModel);
  }
}
