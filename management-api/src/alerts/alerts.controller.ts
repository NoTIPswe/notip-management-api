import { Controller, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SetGatewayAlertsConfigResponseDto } from './dto/set-gateway-alerts-config.response.dto';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly as: AlertsService) {}
  @Put(':gatewayId')
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
    SetGatewayAlertsConfigRequestDto,
  ): Promise<SetGatewayAlertsConfigResponseDto> {
    const models = await this.as.setGatewayAlertsConfig(
      SetGatewayAlertsConfigRequestDto,
    );
  }
}
