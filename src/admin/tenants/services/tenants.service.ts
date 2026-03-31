import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantsPersistenceService } from './tenants.persistence.service';
import { TenantsModel } from '../models/tenant.model';
import { TenantsMapper } from '../tenants.mapper';
import {
  CreateTenantInput,
  DeleteTenantInput,
  UpdateTenantInput,
} from '../interfaces/controller-service.interfaces';
import {
  CreateTenantPersistenceInput,
  DeleteTenantPersistenceInput,
  UpdateTenantPersistenceInput,
} from '../interfaces/service-persistence.interfaces';
import { KeycloakAdminService } from './keycloak-admin.service';
import { UsersRole } from '../../../users/enums/users.enum';
import { DataSource } from 'typeorm';
import { ApiClientService } from '../../../api-client/services/api-client.service';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly tps: TenantsPersistenceService,
    private readonly keycloakAdminService: KeycloakAdminService,
    private readonly apiClientService: ApiClientService,
  ) {}

  async getTenants(): Promise<TenantsModel[]> {
    const entities = await this.tps.getTenants();
    return entities.map((entity) => TenantsMapper.toModel(entity));
  }

  async getTenantUsers(
    tenantId: string,
  ): Promise<{ user_id: string; role: string }[]> {
    const users = await this.tps.getUsersByTenant(tenantId);
    return users.map((u) => ({
      user_id: u.id,
      role: u.role,
    }));
  }

  async createTenant(input: CreateTenantInput): Promise<TenantsModel> {
    this.logger.log(`Creating tenant: ${input.name}`);

    return await this.dataSource.transaction(async (manager) => {
      const persistenceInput: CreateTenantPersistenceInput = {
        name: input.name,
      };

      const tenant = await this.tps.createTenant(persistenceInput, manager);
      let keycloakUserId = '';

      try {
        keycloakUserId = await this.keycloakAdminService.createTenantAdminUser({
          email: input.adminEmail,
          name: input.adminName,
          password: input.adminPassword,
          tenantId: tenant.id,
        });

        await this.tps.createTenantAdminLocalUser(
          {
            tenantId: tenant.id,
            id: keycloakUserId,
            email: input.adminEmail,
            name: input.adminName,
            role: UsersRole.TENANT_ADMIN,
          },
          manager,
        );

        return TenantsMapper.toModel(tenant);
      } catch (e: unknown) {
        this.logger.error(
          `Failed to complete tenant creation for '${input.name}', rolling back Keycloak...`,
        );
        if (keycloakUserId) {
          try {
            await this.keycloakAdminService.deleteUser(keycloakUserId);
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Critical: Failed to delete Keycloak user ${keycloakUserId} during rollback: ${errorMsg}`,
            );
          }
        }
        throw e;
      }
    });
  }

  async updateTenant(input: UpdateTenantInput): Promise<TenantsModel> {
    this.logger.log(`Updating tenant: ${input.id}`);

    const existing = await this.tps
      .getTenants()
      .then((ts) => ts.find((t) => t.id === input.id));
    if (!existing) throw new NotFoundException('Tenant not found');

    const persistenceInput: UpdateTenantPersistenceInput = {
      id: input.id,
      name: input.name,
      status: input.status,
      suspensionIntervalDays: input.suspensionIntervalDays,
    };

    const entity = await this.tps.updateTenant(persistenceInput);
    if (!entity) throw new NotFoundException('Tenant not found');

    if (input.name && input.name !== existing.name) {
      await this.keycloakAdminService.updateTenantGroup(input.id, input.id);
    }

    return TenantsMapper.toModel(entity);
  }

  async deleteTenant(input: DeleteTenantInput): Promise<void> {
    this.logger.log(`Deleting tenant: ${input.id}`);
    const allTenantUsers = await this.tps.getUsersByTenant(input.id);

    return await this.dataSource.transaction(async (manager) => {
      for (const user of allTenantUsers) {
        if (user.id) {
          await this.keycloakAdminService.deleteUser(user.id);
        }
      }

      await this.keycloakAdminService.deleteTenantGroup(input.id);

      await this.apiClientService.deleteApiClientsForTenant(input.id);

      const persistenceInput: DeleteTenantPersistenceInput = {
        id: input.id,
      };
      const deletedEntity = await this.tps.deleteTenant(
        persistenceInput,
        manager,
      );
      if (!deletedEntity) throw new NotFoundException('Tenant not found');
    });
  }
}
