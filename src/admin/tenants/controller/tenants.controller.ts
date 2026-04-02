import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TenantsService } from '../services/tenants.service';
import { TenantsResponseDto } from '../dto/tenants.response.dto';
import { TenantsMapper } from '../tenants.mapper';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTenantRequestDto } from '../dto/create-tenant.request.dto';
import { UpdateTenantRequestDto } from '../dto/update-tenant.request.dto';
import { UpdateTenantsResponseDto } from '../dto/update-tenant.response.dto';
import { DeleteTenantResponseDto } from '../dto/delete-tenant.response.dto';
import { AdminOnly } from '../../../common/decorators/access-policy.decorator';
import { Audit } from '../../../common/decorators/audit.decorator';

@ApiTags('Admin Tenants')
@AdminOnly()
@Controller('admin/tenants')
export class TenantsController {
  constructor(private readonly ts: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({
    status: 200,
    description: 'List of tenants',
    type: TenantsResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTenants(): Promise<TenantsResponseDto[]> {
    const models = await this.ts.getTenants();
    return models.map((model) => TenantsMapper.toResponseDto(model));
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get all users of a tenant' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      type: 'array',
      items: {
        properties: {
          user_id: { type: 'string' },
          role: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTenantUsers(
    @Param('id') id: string,
  ): Promise<{ user_id: string; role: string }[]> {
    return this.ts.getTenantUsers(id);
  }

  @Post()
  @Audit({ action: 'CREATE_TENANT', resource: 'Tenants' })
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: TenantsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Tenant with the same name already exists',
  })
  async createTenant(
    @Body() dto: CreateTenantRequestDto,
  ): Promise<TenantsResponseDto> {
    const tenantModel = await this.ts.createTenant(dto);
    return TenantsMapper.toResponseDto(tenantModel);
  }

  @Patch(':id')
  @Audit({ action: 'UPDATE_TENANT', resource: 'Tenants' })
  @ApiOperation({ summary: 'Update tenant details' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: TenantsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateTenant(
    @Param('id') id: string,
    @Body() dto: UpdateTenantRequestDto,
  ): Promise<UpdateTenantsResponseDto> {
    const tenantModel = await this.ts.updateTenant({ id, ...dto });
    return TenantsMapper.toUpdateResponseDto(tenantModel);
  }

  @Delete(':id')
  @Audit({ action: 'DELETE_TENANT', resource: 'Tenants' })
  @ApiOperation({ summary: 'Delete a tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant deleted successfully',
    type: DeleteTenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async deleteTenant(@Param('id') id: string): Promise<void> {
    await this.ts.deleteTenant({ id });
  }
}
