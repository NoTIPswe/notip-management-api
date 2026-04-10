import { plainToInstance } from 'class-transformer';
import { AlertsModel } from './models/alerts.model';
import { AlertsResponseDto } from './dto/alerts.response.dto';
import { SetAlertsConfigDefaultResponseDto } from './dto/set-alerts-config-default.response.dto';
import { SetGatewayAlertsConfigResponseDto } from './dto/set-gateway-alerts-config.response.dto';
import {
  AlertsConfigResponseDto,
  AlertsGatewayOverridesResponseDto,
} from './dto/alerts-config.response.dto';
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
    const defaultConfig = entities
      .filter((e) => e.gatewayId === null)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    const overrides = entities.filter((e) => e.gatewayId !== null);

    return plainToInstance(AlertsConfigModel, {
      defaultTimeoutMs: defaultConfig?.gatewayTimeoutMs ?? 60000,
      defaultUpdatedAt: defaultConfig?.updatedAt,
      gatewayOverrides: overrides.map((o) => ({
        gatewayId: o.gatewayId,
        gatewayTimeoutMs: o.gatewayTimeoutMs,
        updatedAt: o.updatedAt,
      })),
    });
  }
  static toAlertsResponseDto(model: AlertsModel): AlertsResponseDto {
    const dto = new AlertsResponseDto();
    dto.id = model.id;
    dto.gatewayId = model.gatewayId;
    dto.type = model.type;
    const createdAt = this.toIsoDateString(model.createdAt, new Date());
    const lastSeen = this.toIsoDateString(
      model.details?.lastSeen,
      new Date(createdAt),
    );
    dto.details = {
      lastSeen,
      timeoutConfigured: Number(model.details?.timeoutConfigured ?? 0),
    };
    dto.createdAt = createdAt;
    return dto;
  }
  static toSetAlertsConfigDefaultResponseDto(
    entity: AlertsConfigEntity,
  ): SetAlertsConfigDefaultResponseDto {
    const dto = new SetAlertsConfigDefaultResponseDto();
    dto.tenantId = entity.tenantId;
    dto.defaultTimeoutMs = entity.gatewayTimeoutMs;
    dto.defaultUpdatedAt = entity.updatedAt.toISOString();
    return dto;
  }
  static toSetGatewayAlertsConfigResponseDto(
    entity: AlertsConfigEntity,
  ): SetGatewayAlertsConfigResponseDto {
    const dto = new SetGatewayAlertsConfigResponseDto();
    dto.gatewayId = entity.gatewayId ?? '';
    dto.timeoutMs = entity.gatewayTimeoutMs;
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
  static toAlertsConfigResponseDto(
    model: AlertsConfigModel,
  ): AlertsConfigResponseDto {
    const overrides = model.gatewayOverrides.map((override) => {
      const overrideDto = new AlertsGatewayOverridesResponseDto();
      overrideDto.gatewayId = override.gatewayId;
      overrideDto.timeoutMs = override.gatewayTimeoutMs;

      if (override.updatedAt) {
        overrideDto.updatedAt = override.updatedAt.toISOString();
      }

      return overrideDto;
    });

    const dto = new AlertsConfigResponseDto();
    dto.defaultTimeoutMs = model.defaultTimeoutMs;

    if (model.defaultUpdatedAt) {
      dto.defaultUpdatedAt = model.defaultUpdatedAt.toISOString();
    }

    dto.gatewayOverrides = overrides;
    return dto;
  }

  private static toIsoDateString(
    value: Date | string | null | undefined,
    fallback: Date,
  ): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    return fallback.toISOString();
  }
}
