import { Injectable } from '@nestjs/common';
import { TenantsPersistenceService } from './tenants.persistence.service';
import { TenantsModel } from './tenant.model';
import { TenantsMapper } from './tenants.mapper';

@Injectable()
export class TenantsService {
  constructor(private readonly tps: TenantsPersistenceService) {}

  async getTenants(): Promise<TenantsModel[]> {
    const entities = await this.tps.getTenants();
    return entities.map(TenantsMapper.toModel);
  }
  async createTenant(CreateTenantInput): Promise<TenantsModel> {
    const entity = await this.tps.createTenant(CreateTenantInput);
    return TenantsMapper.toModel(entity);
  }
  async updateTenant(id: string, UpdateTenantInput): Promise<TenantsModel> {
    const entity = await this.tps.updateTenant(UpdateTenantInput);
    return TenantsMapper.toModel(entity);
  }
  async deleteTenant(id: string): Promise<void> {
    await this.tps.deleteTenant(id);
  }
}
