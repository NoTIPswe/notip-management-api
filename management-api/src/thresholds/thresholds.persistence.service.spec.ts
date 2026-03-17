import { Test, TestingModule } from '@nestjs/testing';
import { ThresholdsPersistenceService } from './thresholds.persistence.service';

describe('ThresholdsPersistenceService', () => {
  let service: ThresholdsPersistenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThresholdsPersistenceService],
    }).compile();

    service = module.get<ThresholdsPersistenceService>(ThresholdsPersistenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
