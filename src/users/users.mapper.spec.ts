import { UsersMapper } from './users.mapper';
import { UserEntity } from './entities/user.entity';
import { UsersRole } from './enums/users.enum';
import { UserModel } from './models/user.model';
import { instanceToPlain } from 'class-transformer';

describe('UsersMapper', () => {
  describe('toModel', () => {
    it('should map UserEntity to UserModel', () => {
      const entity = new UserEntity();
      entity.id = 'id';
      entity.tenantId = 'tenant';
      entity.email = 'email@test.com';
      entity.username = 'Name';
      entity.role = UsersRole.TENANT_ADMIN;
      entity.permissions = ['p1'];
      entity.lastAccess = new Date('2026-01-01');
      entity.createdAt = new Date('2026-01-01');

      const model = UsersMapper.toModel(entity);

      expect(model.id).toBe(entity.id);
      expect(model.tenantId).toBe(entity.tenantId);
      expect(model.email).toBe(entity.email);
      expect(model.username).toBe(entity.username);
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
      model.username = 'n';
      model.role = UsersRole.TENANT_USER;

      const dto = UsersMapper.toUpdateUserResponseDto(model);

      expect(dto.id).toBe(model.id);
      expect(dto.email).toBe(model.email);
      expect(dto.username).toBe(model.username);
      expect(dto.role).toBe(model.role);
      expect(typeof dto.updatedAt).toBe('string');
      expect(Number.isNaN(Date.parse(dto.updatedAt))).toBe(false);
      expect(instanceToPlain(dto)).toEqual(
        expect.objectContaining({
          updated_at: dto.updatedAt,
        }),
      );
    });
  });

  describe('toUserResponseDto', () => {
    it('should map UserModel to UserResponseDto', () => {
      const model = new UserModel();
      model.id = 'id';
      model.email = 'e';
      model.username = 'n';
      model.role = UsersRole.TENANT_USER;
      model.lastAccess = new Date('2026-01-01T00:00:00.000Z');

      const dto = UsersMapper.toUserResponseDto(model);

      expect(dto.id).toBe(model.id);
      expect(dto.email).toBe(model.email);
      expect(dto.username).toBe(model.username);
      expect(dto.role).toBe(model.role);
      expect(dto.lastAccess).toBe(model.lastAccess.toISOString());
      expect(instanceToPlain(dto)).toEqual(
        expect.objectContaining({
          last_access: model.lastAccess.toISOString(),
        }),
      );
    });
  });

  describe('toCreateUserResponseDto', () => {
    it('should map UserModel to CreateUserResponseDto', () => {
      const model = new UserModel();
      model.id = 'id';
      model.email = 'e';
      model.username = 'n';
      model.role = UsersRole.TENANT_USER;
      model.createdAt = new Date('2026-01-01T00:00:00.000Z');

      const dto = UsersMapper.toCreateUserResponseDto(model);

      expect(dto.id).toBe(model.id);
      expect(dto.email).toBe(model.email);
      expect(dto.username).toBe(model.username);
      expect(dto.role).toBe(model.role);
      expect(dto.createdAt).toBe(model.createdAt.toISOString());
    });
  });
});
