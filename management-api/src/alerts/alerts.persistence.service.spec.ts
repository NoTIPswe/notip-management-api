import { Test, TestingModule } from '@nestjs/testing';
import { AlertsPersistenceService } from './alerts.persistence.service';

describe('AlertsPersistenceService', () => {
  let service: AlertsPersistenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsPersistenceService],
    }).compile();

    service = module.get<AlertsPersistenceService>(AlertsPersistenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
