import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { TenantId } from '../../common/decorators/tenants.decorator';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersRole } from '../../users/enums/users.enum';
import { ApiClientService } from '../services/api-client.service';
import { CreateApiClientRequestDto } from '../dto/create-api-client.request.dto';
import { CreateApiClientResponseDto } from '../dto/create-api-client.response.dto';
import { ApiClientMapper } from '../api-client.mapper';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiClientResponseDto } from '../dto/api-client.response.dto';
import { Audit } from '../../common/decorators/audit.decorator';

@TenantScoped()
@Roles(UsersRole.TENANT_ADMIN)
@Controller('api-clients')
export class ApiClientController {
  constructor(private readonly acs: ApiClientService) {}

  @Post()
  @Audit({ action: 'CREATE_API_CLIENT', resource: 'ApiClients' })
  @ApiOperation({ summary: 'Create a new API client for the tenant' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 409,
    description: 'API client with the same name already exists',
  })
  async createApiClient(
    @TenantId() tenantId: string,
    @Body() input: CreateApiClientRequestDto,
  ): Promise<CreateApiClientResponseDto> {
    const { model, clientSecret } = await this.acs.createApiClient(
      tenantId,
      input.name,
    );
    return ApiClientMapper.toCreateApiClientResponseDto(model, clientSecret);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API clients for the tenant' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getApiClients(
    @TenantId() tenantId: string,
  ): Promise<ApiClientResponseDto[]> {
    const apiClients = await this.acs.getApiClients(tenantId);
    return apiClients.map((apiClient) =>
      ApiClientMapper.toApiClientsResponseDto(apiClient),
    );
  }

  @Delete(':id')
  @Audit({ action: 'DELETE_API_CLIENT', resource: 'ApiClients' })
  @ApiOperation({ summary: 'Delete an API client for the tenant' })
  @ApiResponse({ status: 200, description: 'API client deleted' })
  @ApiResponse({ status: 404, description: 'API client not found' })
  async deleteApiClient(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.acs.deleteApiClient(tenantId, id);
  }
}
