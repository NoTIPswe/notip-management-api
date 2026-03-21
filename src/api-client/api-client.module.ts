import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiClientController } from './controller/api-client.controller';
import { ApiClientService } from './services/api-client.service';
import { ApiClientPersistenceService } from './services/api-client.persistence.service';
import { ApiClientEntity } from './entities/api-client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiClientEntity])],
  controllers: [ApiClientController],
  providers: [ApiClientService, ApiClientPersistenceService],
})
export class ApiClientModule {}
