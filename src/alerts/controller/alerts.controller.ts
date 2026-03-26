import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SetGatewayAlertsConfigResponseDto } from '../dto/set-gateway-alerts-config.response.dto';
import { AlertsService } from '../services/alerts.service';
import { AlertsMapper } from '../alerts.mapper';
import { SetGatewayAlertsConfigRequestDto } from '../dto/set-gateway-alerts-config.request.dto';
import { TenantId } from '../../common/decorators/tenants.decorator';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersRole } from '../../users/enums/users.enum';
import { AlertsConfigResponseDto } from '../dto/alerts-config.response.dto';
import { SetAlertsConfigDefaultRequestDto } from '../dto/set-alerts-config-default.request.dto';
import { SetAlertsConfigDefaultResponseDto } from '../dto/set-alerts-config-default.response.dto';
import { AlertsResponseDto } from '../dto/alerts.response.dto';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Alerts')
@TenantScoped()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly as: AlertsService) {}

  @Get()
  @Roles(UsersRole.TENANT_ADMIN, UsersRole.TENANT_USER)
  @ApiOperation({ summary: 'Get alerts for the tenant in a time range' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'gateway_id', required: false, type: String })
  async getAlerts(
    @TenantId() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('gateway_id') gatewayId?: string,
  ): Promise<AlertsResponseDto[]> {
    const models = await this.as.getAlerts({ tenantId, from, to, gatewayId });
    return models.map((model) => AlertsMapper.toAlertsResponseDto(model));
  }

  @Get('config')
  @Roles(UsersRole.TENANT_ADMIN, UsersRole.TENANT_USER)
  @ApiOperation({ summary: 'Get alert configuration for the tenant' })
  async getAlertsConfig(
    @TenantId() tenantId: string,
  ): Promise<AlertsConfigResponseDto> {
    const model = await this.as.getAlertsConfig({ tenantId });
    return AlertsMapper.toAlertsConfigResponseDto(model);
  }

  @Put('config/default')
  @Audit({ action: 'SET_DEFAULT_ALERTS_CONFIG', resource: 'Alerts' })
  @Roles(UsersRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Set default alert configuration for the tenant' })
  async setDefaultAlertsConfig(
    @TenantId() tenantId: string,
    @Body() dto: SetAlertsConfigDefaultRequestDto,
  ): Promise<SetAlertsConfigDefaultResponseDto> {
    const entity = await this.as.setDefaultAlertsConfig({
      tenantId,
      defaultTimeoutMs: dto.tenantUnreachableTimeoutMs,
    });
    return AlertsMapper.toSetAlertsConfigDefaultResponseDto(entity);
  }

  @Put('config/gateway/:gatewayId')
  @Audit({ action: 'SET_GATEWAY_ALERTS_CONFIG', resource: 'Alerts' })
  @Roles(UsersRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Set alert configuration for a specific gateway' })
  @ApiResponse({
    status: 200,
    description: 'Alert configuration updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 403,
    description: 'Gateway not associated with tenant of JWT',
  })
  @ApiResponse({ status: 404, description: 'Gateway not found' })
  async setGatewayAlertsConfig(
    @TenantId() tenantId: string,
    @Param('gatewayId') gatewayId: string,
    @Body() dto: SetGatewayAlertsConfigRequestDto,
  ): Promise<SetGatewayAlertsConfigResponseDto> {
    const entity = await this.as.setGatewayAlertsConfig({
      tenantId,
      gatewayId,
      gatewayTimeoutMs: dto.gatewayUnreachableTimeoutMs,
    });
    return AlertsMapper.toSetGatewayAlertsConfigResponseDto(entity);
  }

  @Delete('config/gateway/:gatewayId')
  @Audit({ action: 'DELETE_GATEWAY_ALERTS_CONFIG', resource: 'Alerts' })
  @Roles(UsersRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Delete alert configuration for a specific gateway',
  })
  @ApiResponse({
    status: 200,
    description: 'Alert configuration deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Gateway not associated with tenant of JWT',
  })
  @ApiResponse({ status: 404, description: 'Gateway not found' })
  async deleteGatewayAlertsConfig(
    @TenantId() tenantId: string,
    @Param('gatewayId') gatewayId: string,
  ): Promise<{ message: string }> {
    await this.as.deleteGatewayAlertsConfig(tenantId, gatewayId);
    return { message: 'deleted' };
  }
}
