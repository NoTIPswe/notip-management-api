import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
import { KeycloakAdminService } from '../../admin/tenants/services/keycloak-admin.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly ps: UsersPersistenceService,
    private readonly keycloakAdminService: KeycloakAdminService,
  ) {}

  async getUsers(input: GetUsersInput): Promise<UserModel[]> {
    const entities = await this.ps.getUsers(input.tenantId);
    if (entities.length === 0) {
      throw new NotFoundException('No users found in this tenant');
    }
    return entities.map((entity) => UsersMapper.toModel(entity));
  }

  async createUser(input: CreateUserInput): Promise<UserModel> {
    const keycloakId = await this.keycloakAdminService.createTenantUser({
      email: input.email,
      name: input.name,
      password: input.password,
      tenantId: input.tenantId,
      role: input.role,
    });

    const persistenceInput: CreateUserPersistenceInput = {
      email: input.email,
      name: input.name,
      role: input.role,
      tenantId: input.tenantId,
      keycloakId,
    };

    try {
      const entity = await this.ps.createUser(persistenceInput);
      return UsersMapper.toModel(entity);
    } catch (error) {
      try {
        await this.keycloakAdminService.deleteUser(keycloakId);
      } catch {
        throw new InternalServerErrorException(
          'Failed to rollback Keycloak user after DB error',
        );
      }
      throw error;
    }
  }

  async updateUser(input: UpdateUserInput): Promise<UserModel> {
    const persistenceInput: UpdateUserPersistenceInput = {
      id: input.id,
      email: input.email,
      name: input.name,
      role: input.role,
      permissions: input.permissions,
    };
    const entity = await this.ps.updateUser(persistenceInput);
    if (!entity) {
      throw new NotFoundException('User not found');
    }

    if (entity.keycloakId && input.role) {
      await this.keycloakAdminService.syncUserApplicationRole(
        entity.keycloakId,
        input.role,
      );
    }

    return UsersMapper.toModel(entity);
  }

  async deleteUsers(input: DeleteUsersInput): Promise<number> {
    const users = await this.ps.getUsersByIds(input.ids);
    for (const user of users) {
      if (user.keycloakId) {
        await this.keycloakAdminService.deleteUser(user.keycloakId);
      }
    }

    return this.ps.deleteUsersByIds(input.ids);
  }
}
