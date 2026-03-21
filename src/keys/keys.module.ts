import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeysController } from './controller/keys.controller';
import { KeysService } from './services/keys.service';
import { GatewaysKeysPersistenceService } from './services/keys.persistence.service';
import { KeyEntity } from './entities/key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KeyEntity])],
  controllers: [KeysController],
  providers: [KeysService, GatewaysKeysPersistenceService],
})
export class KeysModule {}
