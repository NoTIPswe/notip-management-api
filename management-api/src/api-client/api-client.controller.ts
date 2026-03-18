import { Controller } from '@nestjs/common';
import { TenantScoped } from 'src/common/decorators/access-policy.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UsersRole } from 'src/users/enums/users.enum';
import { ApiClientService } from './api-client.service';
import { CreateApiClientRequestDto } from './dto/create-api-client.request.dto';
import { CreateApiClientResponseDto } from './dto/create-api-client.response.dto';
import { ApiClientMapper } from './api-client.mapper';

@TenantScoped()
@Roles(UsersRole.TENANT_ADMIN)
@Controller('api-client')
export class ApiClientController {
  constructor(private readonly acs: ApiClientService) {}

  async createApiClient(
    input: CreateApiClientRequestDto,
  ): Promise<CreateApiClientResponseDto> {
    const apiClient = await this.acs.createApiClient(input.name);
    return ApiClientMapper.toCreateApiClientResponseDto(apiClient);
  }

  async getApiClients(): Promise<CreateApiClientResponseDto[]> {
    const apiClients = await this.acs.getApiClients();
    return apiClients.map((apiClient) =>
      ApiClientMapper.toCreateApiClientResponseDto(apiClient),
    );
  }

  async deleteApiClient(id: string): Promise<void> {
    await this.acs.deleteApiClient(id);
  }
}
