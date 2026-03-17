import { Module } from '@nestjs/common';
import { KeysService } from './keys.service';
import { KeysController } from './keys.controller';

@Module({
  providers: [KeysService],
  controllers: [KeysController]
})
export class KeysModule {}
