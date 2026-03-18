import { Module } from '@nestjs/common';
import { KeysController } from './keys.controller';
import { KeysService } from './keys.service';
import { GatewaysKeysPersistenceService } from './keys.persistence.service';

@Module({
  controllers: [KeysController],
  providers: [KeysService, GatewaysKeysPersistenceService],
})
export class KeysModule {}
