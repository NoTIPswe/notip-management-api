import { Module } from '@nestjs/common';
import { UsersController } from './controller/users.controller';
import { UsersService } from './services/users.service';
import { UsersPersistenceService } from './services/users.persistence.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersPersistenceService],
})
export class UsersModule {}
