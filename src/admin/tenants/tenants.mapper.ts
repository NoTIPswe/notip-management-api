import { TenantEntity } from '../../common/entities/tenant.entity';
import { TenantsResponseDto } from './dto/tenants.response.dto';
import { UpdateTenantsResponseDto } from './dto/update-tenant.response.dto';
import { TenantsModel } from './models/tenant.model';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export class TenantsMapper {
  private static toSuspensionIntervalDays(model: TenantsModel): number | null {
    if (!model.suspensionUntil) {
      return model.suspensionIntervalDays ?? null;
    }

    const remainingMs = model.suspensionUntil.getTime() - Date.now();
    if (remainingMs <= 0) {
      return 0;
    }

    return Math.ceil(remainingMs / DAY_IN_MS);
  }

  static toModel(entity: TenantEntity): TenantsModel {
    const model = new TenantsModel();
    model.id = entity.id;
    model.name = entity.name;
    model.status = entity.status;
    model.suspensionIntervalDays = entity.suspensionIntervalDays;
    model.suspensionUntil = entity.suspensionUntil;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    return model;
  }
  static toResponseDto(model: TenantsModel): TenantsResponseDto {
    const dto = new TenantsResponseDto();
    dto.id = model.id;
    dto.name = model.name;
    dto.status = model.status;
    dto.createdAt = model.createdAt.toISOString();
    dto.suspensionIntervalDays = TenantsMapper.toSuspensionIntervalDays(model);
    return dto;
  }

  static toUpdateResponseDto(model: TenantsModel): UpdateTenantsResponseDto {
    const dto = new UpdateTenantsResponseDto();
    dto.id = model.id;
    dto.name = model.name;
    dto.status = model.status;
    dto.updatedAt = model.updatedAt.toISOString();
    return dto;
  }
}
