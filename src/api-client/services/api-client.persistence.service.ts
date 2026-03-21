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

  async createApiClient(name: string): Promise<ApiClientEntity> {
    const newApiClient = this.r.create({
      name,
    });
    return await this.r.save(newApiClient);
  }

  async getApiClients(): Promise<ApiClientEntity[]> {
    return await this.r.find();
  }

  async deleteApiClient(id: string): Promise<void | null> {
    const apiClient = await this.r.findOneBy({ id });
    if (!apiClient) {
      return null;
    }
    await this.r.delete(id);
  }
}
