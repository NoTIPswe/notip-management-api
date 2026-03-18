import { ApiClientResponseDto } from './dto/api-client.response.dto';
import { CreateApiClientResponseDto } from './dto/create-api-client.response.dto';
import { ApiClientModel } from './models/api-client.model';

export class ApiClientMapper {
  static toModel(apiClientEntity: any): ApiClientModel {
    return {
      id: apiClientEntity.id,
      tenantId: apiClientEntity.tenantId,
      name: apiClientEntity.name,
      KeycloakClientId: apiClientEntity.KeycloakClientId,
      createdAt: apiClientEntity.createdAt,
    };
  }

  static toApiClientsResponseDto(
    apiClientModel: ApiClientModel,
  ): ApiClientResponseDto {
    return {
      id: apiClientModel.id,
      name: apiClientModel.name,
      clientId: apiClientModel.KeycloakClientId,
      createdAt: apiClientModel.createdAt,
    };
  }

  static toCreateApiClientResponseDto(
    apiClientModel: ApiClientModel,
  ): CreateApiClientResponseDto {
    return {
      id: apiClientModel.id,
      name: apiClientModel.name,
      clientId: apiClientModel.KeycloakClientId,
      createdAt: apiClientModel.createdAt,
    };
  }
}
