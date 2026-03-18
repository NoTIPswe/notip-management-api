import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GatewayResponseDto } from './dto/gateway.response.dto';
import { GatewaysService } from './gateways.service';
import { AddGatewayResponseDto } from './dto/add-gateway.response.dto';
import { AddGatewayRequestDto } from './dto/add-gateway.request.dto';

@Controller('admin/gateways')
export class GatewaysController {
  constructor(private readonly gs: GatewaysService) {}
  @Get()
  @ApiOperation({ summary: 'Get all Gateways' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getGateways(
    @Query('tenant_id') tenantId?: string,
  ): Promise<GatewayResponseDto[]> {
    return this.gs.getGateways(tenantId);
  }
  @Post()
  @ApiOperation({ summary: 'Add Gateway to a Tenant' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Factory_id already registered' })
  async addGateway(
    @Body() input: AddGatewayRequestDto,
  ): Promise<AddGatewayResponseDto> {
    return this.gs.addGateway(input);
  }
}
