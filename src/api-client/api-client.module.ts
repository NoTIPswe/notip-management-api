import { Module } from '@nestjs/common';
import { ApiClientController } from './controller/api-client.controller';
import { ApiClientService } from './services/api-client.service';
import { ApiClientPersistenceService } from './services/api-client.persistence.service';

@Module({
  controllers: [ApiClientController],
  providers: [ApiClientService, ApiClientPersistenceService],
})
export class ApiClientModule {}
