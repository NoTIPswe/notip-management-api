import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GatewayResponseDto } from './dto/gateway.response.dto';
import { GatewaysService } from './gateways.service';
import { AddGatewayResponseDto } from './dto/add-gateway.response.dto';
import { AddGatewayRequestDto } from './dto/add-gateway.request.dto';
import { AdminOnly } from '../../common/decorators/access-policy.decorator';
import { GatewaysMapper } from './gateways.mapper';

@AdminOnly()
@Controller('admin/gateways')
export class GatewaysController {
  constructor(private readonly gs: GatewaysService) {}
  @Get()
  @ApiOperation({ summary: 'Get all Gateways' })
  @ApiQuery({ name: 'tenant_id', required: false, type: String })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getGateways(
    @Query('tenant_id') tenantId?: string,
  ): Promise<GatewayResponseDto[]> {
    return this.gs.getGateways({ tenantId });
  }
  @Post()
  @ApiOperation({ summary: 'Add Gateway to a Tenant' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Factory_id already registered' })
  async addGateway(
    @Body() input: AddGatewayRequestDto,
  ): Promise<AddGatewayResponseDto> {
    const rawInput = input as AddGatewayRequestDto & {
      tenant_id?: string;
      factory_id?: string;
      factory_key_hash?: string;
    };

    return this.gs.addGateway(
      GatewaysMapper.toAddGatewayInput({
        tenantId: rawInput.tenantId ?? rawInput.tenant_id ?? '',
        factoryId: rawInput.factoryId ?? rawInput.factory_id ?? '',
        factoryKeyHash:
          rawInput.factoryKeyHash ?? rawInput.factory_key_hash ?? '',
      }),
    );
  }
}
