import { plainToInstance } from 'class-transformer';
import { AlertsModel } from './models/alerts.model';
import { AlertsResponseDto } from './dto/alerts.response.dto';
import { SetAlertsConfigDefaultResponseDto } from './dto/set-alerts-config-default.response.dto';
import { SetGatewayAlertsConfigResponseDto } from './dto/set-gateway-alerts-config.response.dto';
import { AlertsConfigResponseDto } from './dto/alerts-config.response.dto';
import { AlertsEntity } from './entities/alerts.entity';
import { AlertsConfigEntity } from './entities/alerts.config.entity';
import { AlertsConfigModel } from './models/alerts.config.model';

export class AlertsMapper {
  static toAlertsModel(entity: AlertsEntity): AlertsModel {
    return plainToInstance(AlertsModel, entity);
  }
  static toAlertsConfigModel(
    entities: AlertsConfigEntity[],
  ): AlertsConfigModel {
    const defaultConfig = entities.find((e) => e.gatewayId === null);
    const overrides = entities.filter((e) => e.gatewayId !== null);

    return plainToInstance(AlertsConfigModel, {
      defaultTimeoutMs: defaultConfig?.gatewayTimeoutMs ?? 60000,
      gatewayOverrides: overrides.map((o) => ({
        gatewayId: o.gatewayId,
        gatewayTimeoutMs: o.gatewayTimeoutMs,
        updatedAt: o.updatedAt,
      })),
    });
  }
  static toAlertsResponseDto(model: AlertsModel): AlertsResponseDto {
    return plainToInstance(AlertsResponseDto, model);
  }
  static toSetAlertsConfigDefaultResponseDto(
    entity: AlertsConfigEntity,
  ): SetAlertsConfigDefaultResponseDto {
    return plainToInstance(SetAlertsConfigDefaultResponseDto, {
      tenantId: entity.tenantId,
      defaultTimeoutMs: entity.gatewayTimeoutMs,
      updatedAt: entity.updatedAt,
    });
  }
  static toSetGatewayAlertsConfigResponseDto(
    entity: AlertsConfigEntity,
  ): SetGatewayAlertsConfigResponseDto {
    return plainToInstance(SetGatewayAlertsConfigResponseDto, {
      gatewayId: entity.gatewayId ?? '',
      timeoutMs: entity.gatewayTimeoutMs,
      updatedAt: entity.updatedAt,
    });
  }
  static toAlertsConfigResponseDto(
    model: AlertsConfigModel,
  ): AlertsConfigResponseDto {
    return plainToInstance(AlertsConfigResponseDto, {
      defaultTimeoutMs: model.defaultTimeoutMs,
      gatewayOverrides: model.gatewayOverrides.map((override) => ({
        gatewayId: override.gatewayId,
        timeoutMs: override.gatewayTimeoutMs,
      })),
    });
  }
}
