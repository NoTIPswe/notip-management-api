import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SetGatewayAlertsConfigResponseDto } from './dto/set-gateway-alerts-config.response.dto';
import { AlertsService } from './alerts.service';
import { AlertsMapper } from './alerts.mapper';
import { SetGatewayAlertsConfigRequestDto } from './dto/set-gateway-alerts-config.request.dto';
import { TenantId } from 'src/common/decorators/tenants.decorator';
import { TenantScoped } from 'src/common/decorators/access-policy.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UsersRole } from 'src/users/enums/users.enum';

@TenantScoped()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly as: AlertsService) {}

  @Put(':gatewayId')
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
    const models = await this.as.setGatewayAlertsConfig({
      tenantId,
      gatewayId,
      gatewayTimeoutMs: dto.timeoutMs,
    });
    return AlertsMapper.toSetGatewayAlertsConfigResponseDto(models);
  }
}
