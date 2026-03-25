import { UsersMapper } from './users.mapper';
import { UserEntity } from './entities/user.entity';
import { UsersRole } from './enums/users.enum';
import { UserModel } from './models/user.model';

describe('UsersMapper', () => {
  describe('toModel', () => {
    it('should map UserEntity to UserModel', () => {
      const entity = new UserEntity();
      entity.id = 'id';
      entity.tenantId = 'tenant';
      entity.email = 'email@test.com';
      entity.name = 'Name';
      entity.role = UsersRole.TENANT_ADMIN;
      entity.permissions = ['p1'];
      entity.lastAccess = new Date('2026-01-01');
      entity.createdAt = new Date('2026-01-01');

      const model = UsersMapper.toModel(entity);

      expect(model.id).toBe(entity.id);
      expect(model.tenantId).toBe(entity.tenantId);
      expect(model.email).toBe(entity.email);
      expect(model.name).toBe(entity.name);
      expect(model.role).toBe(entity.role);
      expect(model.permissions).toEqual(entity.permissions);
      expect(model.lastAccess).toEqual(entity.lastAccess);
      expect(model.createdAt).toEqual(entity.createdAt);
    });

    it('should map UserEntity with nulls to UserModel', () => {
      const entity = new UserEntity();
      entity.id = 'id';
      entity.permissions = null;
      entity.lastAccess = null;

      const model = UsersMapper.toModel(entity);

      expect(model.permissions).toBeNull();
      expect(model.lastAccess).toBeNull();
    });
  });

  describe('toUpdateUserResponseDto', () => {
    it('should map UserModel to UpdateUserResponseDto', () => {
      const model = new UserModel();
      model.id = 'id';
      model.email = 'e';
      model.name = 'n';
      model.role = UsersRole.TENANT_USER;

      const dto = UsersMapper.toUpdateUserResponseDto(model);

      expect(dto.id).toBe(model.id);
      expect(dto.email).toBe(model.email);
      expect(dto.name).toBe(model.name);
      expect(dto.role).toBe(model.role);
      expect(dto.updateAt).toBeInstanceOf(Date);
    });
  });

  describe('toUserResponseDto', () => {
    it('should map UserModel to UserResponseDto', () => {
      const model = new UserModel();
      model.id = 'id';
      model.email = 'e';
      model.name = 'n';
      model.role = UsersRole.TENANT_USER;
      model.lastAccess = new Date();

      const dto = UsersMapper.toUserResponseDto(model);

      expect(dto.id).toBe(model.id);
      expect(dto.email).toBe(model.email);
      expect(dto.name).toBe(model.name);
      expect(dto.role).toBe(model.role);
      expect(dto.lastAccess).toEqual(model.lastAccess);
    });
  });

  describe('toCreateUserResponseDto', () => {
    it('should map UserModel to CreateUserResponseDto', () => {
      const model = new UserModel();
      model.id = 'id';
      model.email = 'e';
      model.name = 'n';
      model.role = UsersRole.TENANT_USER;

      const dto = UsersMapper.toCreateUserResponseDto(model);

      expect(dto.id).toBe(model.id);
      expect(dto.email).toBe(model.email);
      expect(dto.name).toBe(model.name);
      expect(dto.role).toBe(model.role);
      expect(dto.createdAt).toBeInstanceOf(Date);
    });
  });
});
