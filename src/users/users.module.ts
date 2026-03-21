import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controller/users.controller';
import { UsersService } from './services/users.service';
import { UsersPersistenceService } from './services/users.persistence.service';
import { UserEntity } from './entities/user.entity';
import { KeycloakAdminService } from '../admin/tenants/services/keycloak-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [UsersService, UsersPersistenceService, KeycloakAdminService],
})
export class UsersModule {}
