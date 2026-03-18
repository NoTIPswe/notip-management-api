import { Module } from '@nestjs/common';
import { ApiClientController } from './api-client.controller';
import { ApiClientService } from './api-client.service';
import { ApiClientPersistenceService } from './api-client.persistence.service';

@Module({
  controllers: [ApiClientController],
  providers: [ApiClientService, ApiClientPersistenceService],
})
export class ApiClientModule {}
