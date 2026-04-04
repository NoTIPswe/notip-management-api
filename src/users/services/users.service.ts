import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
import { UsersRole } from '../enums/users.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

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
    if (input.role === UsersRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'SYSTEM_ADMIN role cannot be assigned in tenant-scoped user APIs',
      );
    }

    const normalizedUsername = this.normalizeUsername(input.username);
    this.logger.log(`Creating user: ${input.email}`);
    const keycloakId = await this.keycloakAdminService.createTenantUser({
      email: input.email,
      username: normalizedUsername,
      password: input.password,
      tenantId: input.tenantId,
      role: input.role,
    });

    const persistenceInput: CreateUserPersistenceInput = {
      email: input.email,
      username: normalizedUsername,
      role: input.role,
      tenantId: input.tenantId,
      id: keycloakId,
    };

    try {
      const entity = await this.ps.createUser(persistenceInput);
      return UsersMapper.toModel(entity);
    } catch (error) {
      this.logger.error(
        `Failed to save user ${input.email} to DB, rolling back Keycloak...`,
      );
      try {
        await this.keycloakAdminService.deleteUser(keycloakId);
      } catch (rollbackError) {
        const errorMsg =
          rollbackError instanceof Error
            ? rollbackError.message
            : String(rollbackError);
        this.logger.error(
          `Critical: Failed to rollback Keycloak user ${keycloakId}: ${errorMsg}`,
        );
        throw new InternalServerErrorException(
          'Failed to rollback Keycloak user after DB error',
        );
      }
      throw error;
    }
  }

  async updateUser(input: UpdateUserInput): Promise<UserModel> {
    if (input.role === UsersRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'SYSTEM_ADMIN role cannot be assigned in tenant-scoped user APIs',
      );
    }

    const normalizedUsername =
      input.username !== undefined
        ? this.normalizeUsername(input.username)
        : undefined;
    this.logger.log(`Updating user: ${input.id}`);
    const persistenceInput: UpdateUserPersistenceInput = {
      id: input.id,
      email: input.email,
      username: normalizedUsername,
      role: input.role,
      permissions: input.permissions,
    };
    const entity = await this.ps.updateUser(persistenceInput);
    if (!entity || entity.tenantId !== input.tenantId) {
      throw new NotFoundException('User not found');
    }

    if (entity.id && input.role) {
      await this.keycloakAdminService.syncUserApplicationRole(
        entity.id,
        input.role,
      );
    }

    if (entity.id && (input.email || normalizedUsername)) {
      await this.keycloakAdminService.updateUser(entity.id, {
        email: input.email,
        username: normalizedUsername,
      });
    }

    return UsersMapper.toModel(entity);
  }

  async deleteUsers(input: DeleteUsersInput): Promise<number> {
    this.logger.log(`Deleting users: ${input.ids.join(', ')}`);
    const users = await this.ps.getUsersByIds(input.ids);

    const usersToDelete = users.filter((u) => {
      // Cannot delete self
      if (input.requesterId && u.id === input.requesterId) {
        this.logger.warn(`User ${u.id} tried to delete themselves, skipping.`);
        return false;
      }
      return true;
    });

    if (usersToDelete.length === 0 && users.length > 0) {
      return 0;
    }

    for (const user of usersToDelete) {
      if (user.id) {
        if (
          user.role === UsersRole.TENANT_ADMIN &&
          input.requesterRole !== UsersRole.SYSTEM_ADMIN
        ) {
          throw new ForbiddenException(
            'Only SYSTEM_ADMIN can delete TENANT_ADMIN users',
          );
        }

        // If we delete a TENANT_ADMIN, check if it's the last one
        if (user.role === UsersRole.TENANT_ADMIN) {
          const allTenantAdmins = await this.ps.getTenantAdmins(user.tenantId);
          const remainingAdmins = allTenantAdmins.filter(
            (admin) => !input.ids.includes(admin.id),
          );

          if (remainingAdmins.length === 0) {
            // Last admin(s) being deleted: cascade to all Keycloak users of this tenant
            const allTenantUsers = await this.ps.getUsers(user.tenantId);
            for (const tenantUser of allTenantUsers) {
              if (tenantUser.id && !input.ids.includes(tenantUser.id)) {
                await this.keycloakAdminService.deleteUser(tenantUser.id);
              }
            }
            // Note: The tenant group and the tenant itself should ideally be deleted here too,
            // but we avoid circular dependency with TenantsService for now.
            // The DB cascade will handle local users deletion when the tenant is deleted via its own endpoint.
            // If the user wants deletion of the last admin to destroy the tenant, we should ensure
            // this is handled, but here we at least fix the "one admin can delete another" requirement.
          }
        }
        await this.keycloakAdminService.deleteUser(user.id);
      }
    }

    const idsToDelete = usersToDelete
      .map((u) => u.id)
      .filter((id): id is string => !!id);
    if (idsToDelete.length === 0) return 0;

    return this.ps.deleteUsersByIds(idsToDelete);
  }

  private normalizeUsername(username: string): string {
    const lowered = username.trim().toLowerCase();
    if (!lowered) {
      return '';
    }

    return `${lowered[0].toUpperCase()}${lowered.slice(1)}`;
  }
}
