import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiClientModel } from './models/api-client.model';
import { ApiClientPersistenceService } from './api-client.persistence.service';
import { ApiClientMapper } from './api-client.mapper';

@Injectable()
export class ApiClientService {
  constructor(private readonly acps: ApiClientPersistenceService) {}
  async createApiClient(name: string): Promise<ApiClientModel> {
    const newApiClient = await this.acps.createApiClient(name);
    return ApiClientMapper.toModel(newApiClient);
  }

  async getApiClients(): Promise<ApiClientModel[]> {
    const apiClients = await this.acps.getApiClients();
    return apiClients.map((apiClient) => ApiClientMapper.toModel(apiClient));
  }

  async deleteApiClient(id: string): Promise<void> {
    const result = await this.acps.deleteApiClient(id);
    if (result === null) {
      throw new NotFoundException(`API Client with id ${id} not found`);
    }
  }
}
