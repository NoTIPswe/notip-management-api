import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  CreateTenantPersistenceInput,
  DeleteTenantPersistenceInput,
  UpdateTenantPersistenceInput,
} from './interfaces/service-persistence.interfaces';
import { TenantEntity } from 'src/common/entities/tenant.entity';

@Injectable()
export class TenantsPersistenceService {
  constructor(private readonly r: Repository<TenantEntity>) {}

  async getTenants(): Promise<TenantEntity[]> {
    return this.r.find();
  }

  async createTenant(
    input: CreateTenantPersistenceInput,
  ): Promise<TenantEntity> {
    const tenant = this.r.create(input);
    return this.r.save(tenant);
  }

  async updateTenant(
    input: UpdateTenantPersistenceInput,
  ): Promise<TenantEntity | null> {
    const tenant = await this.r.findOneBy({ id: input.id });
    if (!tenant) {
      return null;
    }
    Object.assign(tenant, input);
    return this.r.save(tenant);
  }

  async deleteTenant(input: DeleteTenantPersistenceInput): Promise<boolean> {
    const deleteResult = await this.r.delete(input.id);
    return (deleteResult.affected ?? 0) > 0;
  }
}
