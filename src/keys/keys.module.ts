import { Module } from '@nestjs/common';
import { KeysController } from './controller/keys.controller';
import { KeysService } from './services/keys.service';
import { GatewaysKeysPersistenceService } from './services/keys.persistence.service';

@Module({
  controllers: [KeysController],
  providers: [KeysService, GatewaysKeysPersistenceService],
})
export class KeysModule {}
