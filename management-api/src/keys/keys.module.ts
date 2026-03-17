import { Module } from '@nestjs/common';
import { KeysController } from './keys.controller';
import { KeysService } from './keys.service';
import { KeysPersistenceService } from './keys.persistence.service';

@Module({
  controllers: [KeysController],
  providers: [KeysService, KeysPersistenceService]
})
export class KeysModule {}
