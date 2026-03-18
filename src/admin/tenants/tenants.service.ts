import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantsPersistenceService } from './tenants.persistence.service';
import { TenantsModel } from './tenant.model';
import { TenantsMapper } from './tenants.mapper';
import {
  CreateTenantInput,
  DeleteTenantInput,
  UpdateTenantInput,
} from './interfaces/controller-service.interfaces';
import {
  CreateTenantPersistenceInput,
  DeleteTenantPersistenceInput,
  UpdateTenantPersistenceInput,
} from './interfaces/service-persistence.interfaces';

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
  constructor(private readonly tps: TenantsPersistenceService) {}

  async getTenants(): Promise<TenantsModel[]> {
    const entities = await this.tps.getTenants();
    return entities.map(TenantsMapper.toModel);
  }
  async createTenant(input: CreateTenantInput): Promise<TenantsModel> {
    const persistenceInput: CreateTenantPersistenceInput = {
      name: input.name,
    };
    try {
      const entity = await this.tps.createTenant(persistenceInput);
      return TenantsMapper.toModel(entity);
    } catch (e: unknown) {
      if (isDatabaseError(e, '23505')) {
        throw new ConflictException('Tenant name already exists');
      }
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
    const persistenceInput: DeleteTenantPersistenceInput = {
      id: input.id,
    };
    const deletedEntity = await this.tps.deleteTenant(persistenceInput);
    if (!deletedEntity) throw new NotFoundException('Tenant not found');
  }
}
