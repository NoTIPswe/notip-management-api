import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateTenantPersistenceInput } from './interfaces/service-persistence.interfaces';
import { TenantsEntity } from 'src/common/entities/tenants.entity';

@Injectable()
export class TenantsPersistenceService {
  constructor(private readonly r: Repository<TenantsEntity>) {}

  async getTenants(): Promise<TenantsEntity[]> {
    return this.r.find();
  }

  async createTenant(
    input: CreateTenantPersistenceInput,
  ): Promise<TenantsEntity> {
    const tenant = this.r.create(input);
    return this.r.save(tenant);
  }

  async updateTenant(UpdatePersistenceInput): Promise<TenantsEntity> {
    const tenant = await this.r.findOneBy({ id: UpdatePersistenceInput.id });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    Object.assign(tenant, UpdatePersistenceInput);
    return this.r.save(tenant);
  }

  async deleteTenant(id: string): Promise<void> {
    await this.r.delete(id);
  }
}
