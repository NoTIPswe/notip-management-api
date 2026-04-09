import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { In, Repository } from 'typeorm';
import {
  CreateUserPersistenceInput,
  UpdateUserPersistenceInput,
} from '../interfaces/service-persistence.interfaces';
import { UsersRole } from '../enums/users.enum';

@Injectable()
export class UsersPersistenceService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly r: Repository<UserEntity>,
  ) {}

  async getUsers(tenantId: string): Promise<UserEntity[]> {
    return this.r.find({ where: { tenantId } });
  }

  async getTenantAdmins(tenantId: string): Promise<UserEntity[]> {
    return this.r.find({
      where: { tenantId, role: UsersRole.TENANT_ADMIN },
    });
  }

  async createUser(input: CreateUserPersistenceInput): Promise<UserEntity> {
    const user = this.r.create({
      id: input.id,
      tenantId: input.tenantId,
      email: input.email,
      username: input.username,
      role: input.role,
      permissions: input.permissions ?? null,
    });
    return this.r.save(user);
  }

  async updateUser(
    input: UpdateUserPersistenceInput,
  ): Promise<UserEntity | null> {
    const user = await this.r.findOne({
      where: { id: input.id, tenantId: input.tenantId },
    });
    if (!user) {
      return null;
    }
    if (input.email !== undefined) user.email = input.email;
    if (input.username !== undefined) user.username = input.username;
    if (input.role !== undefined) user.role = input.role;
    if (input.permissions !== undefined) {
      user.permissions = input.permissions;
    }
    return this.r.save(user);
  }

  async getUsersByIds(ids: string[], tenantId: string): Promise<UserEntity[]> {
    return this.r.find({ where: { id: In(ids), tenantId } });
  }

  async touchLastAccess(userId: string, timestamp = new Date()): Promise<void> {
    await this.r.update({ id: userId }, { lastAccess: timestamp });
  }

  async deleteUsersByIds(ids: string[], tenantId: string): Promise<number> {
    const result = await this.r.delete({ id: In(ids), tenantId });
    return result.affected ?? 0;
  }
}
