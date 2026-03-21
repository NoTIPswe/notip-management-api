import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTenantPersistenceInput,
  DeleteTenantPersistenceInput,
  UpdateTenantPersistenceInput,
} from '../interfaces/service-persistence.interfaces';
import { TenantEntity } from '../../../common/entities/tenant.entity';
import { UserEntity } from '../../../users/entities/user.entity';
import { UsersRole } from '../../../users/enums/users.enum';

interface CreateTenantAdminLocalUserInput {
  tenantId: string;
  keycloakId: string;
  email: string;
  name: string;
  role: UsersRole;
}

@Injectable()
export class TenantsPersistenceService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly r: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly ur: Repository<UserEntity>,
  ) {}

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

  async createTenantAdminLocalUser(
    input: CreateTenantAdminLocalUserInput,
  ): Promise<UserEntity> {
    const user = this.ur.create({
      tenantId: input.tenantId,
      keycloakId: input.keycloakId,
      email: input.email,
      name: input.name,
      role: input.role,
    });
    return this.ur.save(user);
  }

  async getTenantAdminUsers(tenantId: string): Promise<UserEntity[]> {
    return this.ur.find({
      where: { tenantId, role: UsersRole.TENANT_ADMIN },
      select: { id: true, keycloakId: true },
    });
  }
}
