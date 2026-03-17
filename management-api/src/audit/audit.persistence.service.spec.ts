import { Test, TestingModule } from '@nestjs/testing';
import { AuditPersistenceService } from './audit.persistence.service';

describe('AuditPersistenceService', () => {
  let service: AuditPersistenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditPersistenceService],
    }).compile();

    service = module.get<AuditPersistenceService>(AuditPersistenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
