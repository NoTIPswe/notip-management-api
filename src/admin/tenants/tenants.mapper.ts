import { TenantEntity } from 'src/common/entities/tenant.entity';
import { TenantsResponseDto } from './dto/tenants.response.dto';
import { UpdateTenantsResponseDto } from './dto/update-tenant.response.dto';
import { TenantsModel } from './tenant.model';

export class TenantsMapper {
  static toModel(entity: TenantEntity): TenantsModel {
    const model = new TenantsModel();
    model.id = entity.id;
    model.name = entity.name;
    model.status = entity.status;
    model.suspensionIntervalDays = entity.suspensionIntervalDays;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    return model;
  }
  static toResponseDto(model: TenantsModel): TenantsResponseDto {
    const dto = new TenantsResponseDto();
    dto.id = model.id;
    dto.name = model.name;
    dto.status = model.status;
    dto.createdAt = model.createdAt;
    return dto;
  }

  static toUpdateResponseDto(model: TenantsModel): UpdateTenantsResponseDto {
    const dto = new UpdateTenantsResponseDto();
    dto.id = model.id;
    dto.name = model.name;
    dto.status = model.status;
    dto.updatedAt = model.updatedAt;
    return dto;
  }
}
