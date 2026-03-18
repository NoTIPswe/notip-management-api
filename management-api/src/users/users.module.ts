import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersPersistenceService } from './users.persistence.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersPersistenceService],
})
export class UsersModule {}
