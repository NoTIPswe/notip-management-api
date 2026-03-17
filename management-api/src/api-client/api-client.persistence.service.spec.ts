import { Test, TestingModule } from '@nestjs/testing';
import { ApiClientPersistenceService } from './api-client.persistence.service';

describe('ApiClientPersistenceService', () => {
  let service: ApiClientPersistenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiClientPersistenceService],
    }).compile();

    service = module.get<ApiClientPersistenceService>(ApiClientPersistenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
