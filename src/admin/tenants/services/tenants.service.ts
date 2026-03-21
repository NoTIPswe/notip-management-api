import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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

function isDatabaseError(
  error: unknown,
  code: string,
): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === code
  );
}

@Injectable()
export class TenantsService {
  constructor(
    private readonly tps: TenantsPersistenceService,
    private readonly keycloakAdminService: KeycloakAdminService,
  ) {}

  async getTenants(): Promise<TenantsModel[]> {
    const entities = await this.tps.getTenants();
    return entities.map((entity) => TenantsMapper.toModel(entity));
  }
  async createTenant(input: CreateTenantInput): Promise<TenantsModel> {
    const persistenceInput: CreateTenantPersistenceInput = {
      name: input.name,
    };

    let tenant = null;
    try {
      tenant = await this.tps.createTenant(persistenceInput);
    } catch (e: unknown) {
      if (isDatabaseError(e, '23505')) {
        throw new ConflictException('Tenant name already exists');
      }
      throw e;
    }

    let keycloakUserId = '';

    try {
      keycloakUserId = await this.keycloakAdminService.createTenantAdminUser({
        email: input.adminEmail,
        name: input.adminName,
        password: input.adminPassword,
        tenantId: tenant.id,
      });

      await this.tps.createTenantAdminLocalUser({
        tenantId: tenant.id,
        keycloakId: keycloakUserId,
        email: input.adminEmail,
        name: input.adminName,
        role: UsersRole.TENANT_ADMIN,
      });

      return TenantsMapper.toModel(tenant);
    } catch (e: unknown) {
      await this.safeCleanupTenantCreation(tenant.id, keycloakUserId);
      throw e;
    }
  }
  async updateTenant(input: UpdateTenantInput): Promise<TenantsModel> {
    const persistenceInput: UpdateTenantPersistenceInput = {
      id: input.id,
      name: input.name,
      status: input.status,
      suspensionIntervalDays: input.suspensionIntervalDays,
    };
    try {
      const entity = await this.tps.updateTenant(persistenceInput);
      if (!entity) throw new NotFoundException('Tenant not found');
      return TenantsMapper.toModel(entity);
    } catch (e: unknown) {
      if (isDatabaseError(e, '23505')) {
        throw new ConflictException('Tenant name already exists');
      }
      throw e;
    }
  }
  async deleteTenant(input: DeleteTenantInput): Promise<void> {
    const tenantAdmins = await this.tps.getTenantAdminUsers(input.id);
    for (const tenantAdmin of tenantAdmins) {
      if (tenantAdmin.keycloakId) {
        await this.keycloakAdminService.deleteUser(tenantAdmin.keycloakId);
      }
    }

    const persistenceInput: DeleteTenantPersistenceInput = {
      id: input.id,
    };
    const deletedEntity = await this.tps.deleteTenant(persistenceInput);
    if (!deletedEntity) throw new NotFoundException('Tenant not found');
  }

  private async safeCleanupTenantCreation(
    tenantId: string,
    keycloakUserId: string,
  ): Promise<void> {
    try {
      if (keycloakUserId) {
        await this.keycloakAdminService.deleteUser(keycloakUserId);
      }
    } catch {
      throw new InternalServerErrorException(
        'Tenant rollback failed while deleting Keycloak user',
      );
    }

    await this.tps.deleteTenant({ id: tenantId });
  }
}
