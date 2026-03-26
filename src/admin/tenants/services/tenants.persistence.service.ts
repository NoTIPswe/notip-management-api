import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
  id: string;
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

  private getTenantRepo(manager?: EntityManager): Repository<TenantEntity> {
    return manager ? manager.getRepository(TenantEntity) : this.r;
  }

  private getUserRepo(manager?: EntityManager): Repository<UserEntity> {
    return manager ? manager.getRepository(UserEntity) : this.ur;
  }

  async getTenants(): Promise<TenantEntity[]> {
    return this.r.find();
  }

  async createTenant(
    input: CreateTenantPersistenceInput,
    manager?: EntityManager,
  ): Promise<TenantEntity> {
    const repo = this.getTenantRepo(manager);
    const tenant = repo.create(input);
    return repo.save(tenant);
  }

  async updateTenant(
    input: UpdateTenantPersistenceInput,
    manager?: EntityManager,
  ): Promise<TenantEntity | null> {
    const repo = this.getTenantRepo(manager);
    const tenant = await repo.findOneBy({ id: input.id });
    if (!tenant) {
      return null;
    }
    Object.assign(tenant, input);
    return repo.save(tenant);
  }

  async deleteTenant(
    input: DeleteTenantPersistenceInput,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = this.getTenantRepo(manager);
    const deleteResult = await repo.delete(input.id);
    return (deleteResult.affected ?? 0) > 0;
  }

  async createTenantAdminLocalUser(
    input: CreateTenantAdminLocalUserInput,
    manager?: EntityManager,
  ): Promise<UserEntity> {
    const repo = this.getUserRepo(manager);
    const user = repo.create({
      tenantId: input.tenantId,
      id: input.id,
      email: input.email,
      name: input.name,
      role: input.role,
    });
    return repo.save(user);
  }

  async getTenantAdminUsers(tenantId: string): Promise<UserEntity[]> {
    return this.ur.find({
      where: { tenantId, role: UsersRole.TENANT_ADMIN },
      select: { id: true },
    });
  }

  async getUsersByTenant(tenantId: string): Promise<UserEntity[]> {
    return this.ur.find({
      where: { tenantId },
      select: { id: true, role: true },
    });
  }
}
