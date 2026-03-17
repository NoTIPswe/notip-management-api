import { Test, TestingModule } from '@nestjs/testing';
import { UsersPersistenceService } from './users.persistence.service';

describe('UsersPersistenceService', () => {
  let service: UsersPersistenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersPersistenceService],
    }).compile();

    service = module.get<UsersPersistenceService>(UsersPersistenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
