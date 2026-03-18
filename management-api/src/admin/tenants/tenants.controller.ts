import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsResponseDto } from './dto/tenants.response.dto';
import { TenantsMapper } from './tenants.mapper';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateTenantRequestDto } from './dto/create-tenant.request.dto';
import { UpdateTenantRequestDto } from './dto/update-tenant.request.dto';
import { UpdateTenantsResponseDto } from './dto/update-tenant.response.dto';
import { AdminOnly } from 'src/common/decorators/access-policy.decorator';

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
    return models.map(TenantsMapper.toResponseDto);
  }
  @Post()
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
  @ApiOperation({ summary: 'Delete a tenant' })
  @ApiResponse({ status: 204, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async deleteTenant(@Param('id') id: string): Promise<void> {
    await this.ts.deleteTenant({ id });
  }
}
