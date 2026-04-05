import { ApiClientResponseDto } from './dto/api-client.response.dto';
import { CreateApiClientResponseDto } from './dto/create-api-client.response.dto';
import { ApiClientEntity } from './entities/api-client.entity';
import { ApiClientModel } from './models/api-client.model';

export class ApiClientMapper {
  static toModel(apiClientEntity: ApiClientEntity): ApiClientModel {
    return {
      id: apiClientEntity.id,
      tenantId: apiClientEntity.tenantId,
      name: apiClientEntity.name,
      keycloakClientId: apiClientEntity.keycloakClientId,
      createdAt: apiClientEntity.createdAt,
    };
  }

  static toApiClientsResponseDto(
    apiClientModel: ApiClientModel,
  ): ApiClientResponseDto {
    const dto = new ApiClientResponseDto();
    dto.id = apiClientModel.id;
    dto.name = apiClientModel.name;
    dto.clientId = apiClientModel.keycloakClientId;
    dto.createdAt = apiClientModel.createdAt.toISOString();
    return dto;
  }

  static toCreateApiClientResponseDto(
    apiClientModel: ApiClientModel,
    clientSecret?: string,
  ): CreateApiClientResponseDto {
    const dto = new CreateApiClientResponseDto();
    dto.id = apiClientModel.id;
    dto.name = apiClientModel.name;
    dto.clientId = apiClientModel.keycloakClientId;
    dto.clientSecret = clientSecret;
    dto.createdAt = apiClientModel.createdAt.toISOString();
    return dto;
  }
}
