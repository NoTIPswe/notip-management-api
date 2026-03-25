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
    return {
      id: apiClientModel.id,
      name: apiClientModel.name,
      clientId: apiClientModel.keycloakClientId,
      createdAt: apiClientModel.createdAt,
    };
  }

  static toCreateApiClientResponseDto(
    apiClientModel: ApiClientModel,
    clientSecret?: string,
  ): CreateApiClientResponseDto {
    return {
      id: apiClientModel.id,
      name: apiClientModel.name,
      clientId: apiClientModel.keycloakClientId,
      clientSecret,
      createdAt: apiClientModel.createdAt,
    };
  }
}
