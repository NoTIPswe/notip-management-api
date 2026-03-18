import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogPersistenceService } from './audit.persistence.service';

describe('AuditLogPersistenceService', () => {
  let service: AuditLogPersistenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogPersistenceService],
    }).compile();

    service = module.get<AuditLogPersistenceService>(AuditLogPersistenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
