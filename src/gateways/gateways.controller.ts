import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { TenantScoped } from 'src/common/decorators/access-policy.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UsersRole } from 'src/users/enums/users.enum';
import { TenantId } from 'src/common/decorators/tenants.decorator';
import { GatewaysService } from './gateways.service';
import { GatewayResponseDto } from './dto/gateway.response.dto';
import { UpdateGatewayRequestDto } from './dto/update-gateway.request.dto';
import { UpdateGatewayResponseDto } from './dto/update-gateway.response.dto';
import { GatewaysMapper } from './gateways.mapper';

@TenantScoped()
@Controller('gateways')
export class GatewaysController {
  constructor(private readonly gs: GatewaysService) {}

  @Get()
  @Roles(UsersRole.TENANT_ADMIN, UsersRole.TENANT_USER)
  async getGateways(
    @TenantId() tenantId: string,
  ): Promise<GatewayResponseDto[]> {
    const models = await this.gs.getGateways({ tenantId });
    return models.map(GatewaysMapper.toResponseDto);
  }

  @Get(':id')
  @Roles(UsersRole.TENANT_ADMIN, UsersRole.TENANT_USER)
  async getGatewayById(
    @TenantId() tenantId: string,
    @Param('id') gatewayId: string,
  ): Promise<GatewayResponseDto> {
    const model = await this.gs.findById({ tenantId, gatewayId });
    return GatewaysMapper.toResponseDto(model);
  }

  @Patch(':id')
  @Roles(UsersRole.TENANT_ADMIN)
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
  @Roles(UsersRole.TENANT_ADMIN)
  async deleteGateway(
    @TenantId() tenantId: string,
    @Param('id') gatewayId: string,
  ): Promise<{ message: string }> {
    await this.gs.deleteGateway({ tenantId, gatewayId });
    return { message: 'decommissioned' };
  }
}
