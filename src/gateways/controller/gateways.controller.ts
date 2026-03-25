import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BlockImpersonation } from '../../common/decorators/block-impersonation.decorator';
import { UsersRole } from '../../users/enums/users.enum';
import { TenantId } from '../../common/decorators/tenants.decorator';
import { GatewaysService } from '../services/gateways.service';
import { GatewayResponseDto } from '../dto/gateway.response.dto';
import { UpdateGatewayRequestDto } from '../dto/update-gateway.request.dto';
import { UpdateGatewayResponseDto } from '../dto/update-gateway.response.dto';
import { GatewaysMapper } from '../gateways.mapper';
import { Audit } from '../../common/decorators/audit.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Gateways')
@TenantScoped()
@BlockImpersonation()
@Controller('gateways')
export class GatewaysController {
  constructor(private readonly gs: GatewaysService) {}

  @Get()
  @Roles(UsersRole.TENANT_ADMIN, UsersRole.TENANT_USER)
  @ApiOperation({ summary: 'Get all gateways for the tenant' })
  @ApiResponse({ status: 200, type: GatewayResponseDto, isArray: true })
  async getGateways(
    @TenantId() tenantId: string,
  ): Promise<GatewayResponseDto[]> {
    const models = await this.gs.getGateways({ tenantId });
    return models.map((model) => GatewaysMapper.toResponseDto(model));
  }

  @Get(':id')
  @Roles(UsersRole.TENANT_ADMIN, UsersRole.TENANT_USER)
  @ApiOperation({ summary: 'Get gateway by id' })
  @ApiResponse({ status: 200, type: GatewayResponseDto })
  async getGatewayById(
    @TenantId() tenantId: string,
    @Param('id') gatewayId: string,
  ): Promise<GatewayResponseDto> {
    const model = await this.gs.findById({ tenantId, gatewayId });
    return GatewaysMapper.toResponseDto(model);
  }

  @Patch(':id')
  @Audit({ action: 'UPDATE_GATEWAY', resource: 'Gateways' })
  @Roles(UsersRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update gateway details' })
  @ApiResponse({ status: 200, type: UpdateGatewayResponseDto })
  async updateGateway(
    @TenantId() tenantId: string,
    @Param('id') gatewayId: string,
    @Body() dto: UpdateGatewayRequestDto,
  ): Promise<UpdateGatewayResponseDto> {
    const model = await this.gs.updateGateway({
      tenantId,
      gatewayId,
      name: dto.name,
    });
    return GatewaysMapper.toUpdateResponseDto(model);
  }

  @Delete(':id')
  @Audit({ action: 'DELETE_GATEWAY', resource: 'Gateways' })
  @Roles(UsersRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Delete a gateway' })
  @ApiResponse({ status: 200, description: 'Gateway deleted' })
  async deleteGateway(
    @TenantId() tenantId: string,
    @Param('id') gatewayId: string,
  ): Promise<{ message: string }> {
    await this.gs.deleteGateway({ tenantId, gatewayId });
    return { message: 'deleted' };
  }
}
