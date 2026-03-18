import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsPersistenceService } from './tenants.persistence.service';
import { TenantsModel } from './tenant.model';
import { TenantsMapper } from './tenants.mapper';
import {
  CreateTenantInput,
  UpdateTenantInput,
} from './interfaces/controller-service.interfaces';

@Injectable()
export class TenantsService {
  constructor(private readonly tps: TenantsPersistenceService) {}

  async getTenants(): Promise<TenantsModel[]> {
    const entities = await this.tps.getTenants();
    return entities.map(TenantsMapper.toModel);
  }
  async createTenant(input: CreateTenantInput): Promise<TenantsModel> {
    const entity = await this.tps.createTenant(input);
    return TenantsMapper.toModel(entity);
  }
  async updateTenant(input: UpdateTenantInput): Promise<TenantsModel> {
    const entity = await this.tps.updateTenant(input);
    if (!entity) throw new NotFoundException('Tenant not found');
    return TenantsMapper.toModel(entity);
  }
  async deleteTenant(id: string): Promise<void> {
    const deletedEntity = await this.tps.deleteTenant(id);
    if (!deletedEntity) throw new NotFoundException('Tenant not found');
  }
}
