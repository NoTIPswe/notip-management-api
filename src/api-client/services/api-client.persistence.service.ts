import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiClientEntity } from '../entities/api-client.entity';
import { Repository } from 'typeorm';
@Injectable()
export class ApiClientPersistenceService {
  constructor(
    @InjectRepository(ApiClientEntity)
    private readonly r: Repository<ApiClientEntity>,
  ) {}

  async createApiClient(
    id: string,
    tenantId: string,
    name: string,
    keycloakClientId: string,
  ): Promise<ApiClientEntity> {
    const newApiClient = this.r.create({
      id,
      tenantId,
      name,
      keycloakClientId,
    });
    return await this.r.save(newApiClient);
  }

  async findByName(
    tenantId: string,
    name: string,
  ): Promise<ApiClientEntity | null> {
    return await this.r.findOneBy({ tenantId, name });
  }

  async getApiClients(tenantId: string): Promise<ApiClientEntity[]> {
    return await this.r.findBy({ tenantId });
  }

  async deleteApiClient(tenantId: string, id: string): Promise<string | null> {
    const apiClient = await this.r.findOneBy({ id, tenantId });
    if (!apiClient) {
      return null;
    }
    const keycloakUuid = apiClient.id;
    await this.r.remove(apiClient);
    return keycloakUuid;
  }
}
