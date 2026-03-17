import { Test, TestingModule } from '@nestjs/testing';
import { CostsPersistenceService } from './costs.persistence.service';

describe('CostsPersistenceService', () => {
  let service: CostsPersistenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CostsPersistenceService],
    }).compile();

    service = module.get<CostsPersistenceService>(CostsPersistenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
