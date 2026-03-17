import { Module } from '@nestjs/common';
import { ApiClientController } from './api-client.controller';
import { ApiClientService } from './api-client.service';

@Module({
  controllers: [ApiClientController],
  providers: [ApiClientService]
})
export class ApiClientModule {}
