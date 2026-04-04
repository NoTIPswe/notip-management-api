import { CreateUserResponseDto } from './dto/create-user.response.dto';
import { UpdateUserResponseDto } from './dto/update-user.response.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { UserEntity } from './entities/user.entity';
import { UserModel } from './models/user.model';

export class UsersMapper {
  static toModel(entity: UserEntity): UserModel {
    const model = new UserModel();
    model.id = entity.id;
    model.tenantId = entity.tenantId;
    model.email = entity.email;
    model.username = entity.username;
    model.role = entity.role;
    model.permissions = entity.permissions ?? null;
    model.lastAccess = entity.lastAccess ?? null;
    model.createdAt = entity.createdAt;
    return model;
  }

  static toUpdateUserResponseDto(model: UserModel): UpdateUserResponseDto {
    const dto = new UpdateUserResponseDto();
    dto.id = model.id;
    dto.email = model.email;
    dto.username = model.username;
    dto.role = model.role;
    dto.updateAt = new Date().toISOString();
    return dto;
  }

  static toUserResponseDto(model: UserModel): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = model.id;
    dto.email = model.email;
    dto.username = model.username;
    dto.role = model.role;
    dto.lastAccess = model.lastAccess ? model.lastAccess.toISOString() : null;
    return dto;
  }

  static toCreateUserResponseDto(model: UserModel): CreateUserResponseDto {
    const dto = new CreateUserResponseDto();
    dto.id = model.id;
    dto.email = model.email;
    dto.username = model.username;
    dto.role = model.role;
    dto.createdAt = model.createdAt.toISOString();
    return dto;
  }
}
