import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  CreateTenantPersistenceInput,
  UpdateTenantPersistenceInput,
} from './interfaces/service-persistence.interfaces';
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

  async updateTenant(
    input: UpdateTenantPersistenceInput,
  ): Promise<TenantsEntity | null> {
    const tenant = await this.r.findOneBy({ id: input.id });
    if (!tenant) {
      return null;
    }
    const { id, ...fieldsToUpdate } = input;
    Object.assign(tenant, fieldsToUpdate);
    return this.r.save(tenant);
  }

  async deleteTenant(id: string): Promise<boolean> {
    const deleteResult = await this.r.delete(id);
    return (deleteResult.affected ?? 0) > 0;
  }
}
