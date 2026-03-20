import { Injectable, NotFoundException } from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { UsersMapper } from '../users.mapper';
import {
  CreateUserInput,
  DeleteUsersInput,
  GetUsersInput,
  UpdateUserInput,
} from '../interfaces/controller-service.interfaces';
import { UsersPersistenceService } from './users.persistence.service';
import {
  CreateUserPersistenceInput,
  UpdateUserPersistenceInput,
} from '../interfaces/service-persistence.interfaces';

@Injectable()
export class UsersService {
  constructor(private readonly ps: UsersPersistenceService) {}

  async getUsers(input: GetUsersInput): Promise<UserModel[]> {
    const entities = await this.ps.getUsers(input.tenantId);
    if (entities.length === 0) {
      throw new NotFoundException('No users found in this tenant');
    }
    return entities.map((entity) => UsersMapper.toModel(entity));
  }

  async createUser(input: CreateUserInput): Promise<UserModel> {
    const persistenceInput: CreateUserPersistenceInput = {
      email: input.email,
      name: input.name,
      role: input.role,
      tenantId: input.tenantId,
      password: input.password,
    };
    const entity = await this.ps.createUser(persistenceInput);
    return UsersMapper.toModel(entity);
  }

  async updateUser(input: UpdateUserInput): Promise<UserModel> {
    const persistenceInput: UpdateUserPersistenceInput = {
      id: input.id,
      email: input.email,
      name: input.name,
      role: input.role,
      password: input.password,
    };
    const entity = await this.ps.updateUser(persistenceInput);
    if (!entity) {
      throw new NotFoundException('User not found');
    }
    return UsersMapper.toModel(entity);
  }

  async deleteUsers(input: DeleteUsersInput): Promise<number> {
    return this.ps.deleteUsersByIds(input.ids);
  }
}
