import { plainToInstance } from 'class-transformer';
import { AlertEntity } from './entities/alerts.entity';
import { AlertsModel } from './models/alerts.model';
import { AlertsResponseDto } from './dto/alerts.response.dto';
import { SetAlertsConfigDefaultResponseDto } from './dto/set-alerts-config-default.response.dto';
import { SetGatewayAlertsConfigResponseDto } from './dto/set-gateway-alerts-config.response.dto';
import { AlertsConfigResponseDto } from './dto/alerts-config.response.dto';

export class AlertsMapper {
  static toModel(entity: AlertEntity): AlertsModel {
    return plainToInstance(AlertsModel, entity);
  }
  static toAlertsResponseDto(model: AlertsModel): AlertsResponseDto {
    return plainToInstance(AlertsResponseDto, model);
  }
  static toSetAlertsConfigDefaultResposeDto(
    model: AlertsModel,
  ): SetAlertsConfigDefaultResponseDto {
    return plainToInstance(SetAlertsConfigDefaultResponseDto, model);
  }
  static toSetGatewayAlertsConfigResponseDto(
    model: AlertsModel,
  ): SetGatewayAlertsConfigResponseDto {
    return plainToInstance(SetGatewayAlertsConfigResponseDto, model);
  }
  static toAlertsConfigResponseDto(
    model: AlertsModel,
  ): AlertsConfigResponseDto {
    return plainToInstance(AlertsConfigResponseDto, model);
  }
}
