import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GatewayResponseDto } from '../dto/gateway.response.dto';
import { GatewaysService } from '../services/gateways.service';
import { AddGatewayResponseDto } from '../dto/add-gateway.response.dto';
import { AddGatewayRequestDto } from '../dto/add-gateway.request.dto';
import { AdminOnly } from '../../../common/decorators/access-policy.decorator';
import { GatewaysMapper } from '../gateways.mapper';
import { Audit } from '../../../common/decorators/audit.decorator';

@AdminOnly()
@ApiTags('Admin Gateways')
@Controller('admin/gateways')
export class GatewaysController {
  constructor(private readonly gs: GatewaysService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Gateways' })
  @ApiQuery({ name: 'tenant_id', required: false, type: String })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAdminGateways(
    @Query('tenant_id') tenantId?: string,
  ): Promise<GatewayResponseDto[]> {
    const models = await this.gs.getGateways({ tenantId });
    return models.map((model) => GatewaysMapper.toResponseDto(model));
  }

  @Post()
  @Audit({ action: 'CREATE_GATEWAY', resource: 'Gateways' })
  @ApiOperation({ summary: 'Add Gateway to a Tenant' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Factory_id already registered' })
  async addGateway(
    @Body() input: AddGatewayRequestDto,
  ): Promise<AddGatewayResponseDto> {
    const model = await this.gs.addGateway(input);
    return GatewaysMapper.toAddGatewayResponseDto(model);
  }
}
