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

    const normalizedUsername = input.username
      ? this.normalizeUsername(input.username)
      : undefined;
    this.logger.log(`Updating user: ${input.id}`);
    const persistenceInput: UpdateUserPersistenceInput = {
      id: input.id,
      tenantId: input.tenantId,
      email: input.email,
      username: normalizedUsername,
      role: input.role,
      permissions: input.permissions,
    };
    const entity = await this.ps.updateUser(persistenceInput);
    if (entity?.tenantId !== input.tenantId) {
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
    const users = await this.ps.getUsersByIds(input.ids, input.tenantId);

    const usersToDelete = this.filterUsersForDeletion(users, input);
    if (usersToDelete.length === 0 && users.length > 0) {
      return 0;
    }

    const keycloakUserIdsToDelete = await this.collectKeycloakUserIdsToDelete(
      usersToDelete,
      input,
    );

    const keycloakIds = Array.from(keycloakUserIdsToDelete);
    await Promise.all(
      keycloakIds.map((id) => this.keycloakAdminService.deleteUser(id)),
    );

    const idsToDelete = usersToDelete
      .map((u) => u.id)
      .filter((id): id is string => !!id);
    if (idsToDelete.length === 0) return 0;

    return this.ps.deleteUsersByIds(idsToDelete, input.tenantId);
  }

  private filterUsersForDeletion(
    users: UserModel[],
    input: DeleteUsersInput,
  ): UserModel[] {
    return users.filter((u) => {
      if (input.requesterId && u.id === input.requesterId) {
        this.logger.warn(`User ${u.id} tried to delete themselves, skipping.`);
        return false;
      }
      return true;
    });
  }

  private async collectKeycloakUserIdsToDelete(
    usersToDelete: UserModel[],
    input: DeleteUsersInput,
  ): Promise<Set<string>> {
    const keycloakUserIdsToDelete = new Set<string>();

    for (const user of usersToDelete) {
      if (!user.id) continue;

      this.validateUserDeletionPermission(user, input);
      keycloakUserIdsToDelete.add(user.id);

      if (user.role === UsersRole.TENANT_ADMIN) {
        await this.collectTenantUserIdsForCascade(
          user.tenantId,
          input.ids,
          keycloakUserIdsToDelete,
        );
      }
    }

    return keycloakUserIdsToDelete;
  }

  private validateUserDeletionPermission(
    user: UserModel,
    input: DeleteUsersInput,
  ): void {
    if (
      user.role === UsersRole.TENANT_ADMIN &&
      input.requesterRole !== UsersRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException(
        'Only SYSTEM_ADMIN can delete TENANT_ADMIN users',
      );
    }
  }

  private async collectTenantUserIdsForCascade(
    tenantId: string,
    deletedAdminIds: string[],
    keycloakUserIdsToDelete: Set<string>,
  ): Promise<void> {
    const allTenantAdmins = await this.ps.getTenantAdmins(tenantId);
    const remainingAdmins = allTenantAdmins.filter(
      (admin) => !deletedAdminIds.includes(admin.id),
    );

    if (remainingAdmins.length !== 0) return;

    const allTenantUsers = await this.ps.getUsers(tenantId);
    for (const tenantUser of allTenantUsers) {
      if (tenantUser.id) {
        keycloakUserIdsToDelete.add(tenantUser.id);
      }
    }
  }

  private normalizeUsername(username: string): string {
    const lowered = username.trim().toLowerCase();
    if (!lowered) {
      return '';
    }

    return `${lowered[0].toUpperCase()}${lowered.slice(1)}`;
  }
}
