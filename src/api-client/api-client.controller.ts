import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { TenantScoped } from 'src/common/decorators/access-policy.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UsersRole } from 'src/users/enums/users.enum';
import { ApiClientService } from './api-client.service';
import { CreateApiClientRequestDto } from './dto/create-api-client.request.dto';
import { CreateApiClientResponseDto } from './dto/create-api-client.response.dto';
import { ApiClientMapper } from './api-client.mapper';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiClientResponseDto } from './dto/api-client.response.dto';

@TenantScoped()
@Roles(UsersRole.TENANT_ADMIN)
@Controller('api-client')
export class ApiClientController {
  constructor(private readonly acs: ApiClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API client for the tenant' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 409,
    description: 'API client with the same name already exists',
  })
  async createApiClient(
    @Body() input: CreateApiClientRequestDto,
  ): Promise<CreateApiClientResponseDto> {
    const apiClient = await this.acs.createApiClient(input.name);
    return ApiClientMapper.toCreateApiClientResponseDto(apiClient);
  }
  @Get()
  @ApiOperation({ summary: 'Get all API clients for the tenant' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getApiClients(): Promise<ApiClientResponseDto[]> {
    const apiClients = await this.acs.getApiClients();
    return apiClients.map((apiClient) =>
      ApiClientMapper.toApiClientsResponseDto(apiClient),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API client for the tenant' })
  @ApiResponse({ status: 404, description: 'API client not found' })
  async deleteApiClient(@Param('id') id: string): Promise<void> {
    await this.acs.deleteApiClient(id);
  }
}
