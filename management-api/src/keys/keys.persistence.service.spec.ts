import { Test, TestingModule } from '@nestjs/testing';
import { KeysPersistenceService } from './keys.persistence.service';

describe('KeysPersistenceService', () => {
  let service: KeysPersistenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeysPersistenceService],
    }).compile();

    service = module.get<KeysPersistenceService>(KeysPersistenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
