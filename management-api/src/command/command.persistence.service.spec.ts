import { Test, TestingModule } from '@nestjs/testing';
import { CommandPersistenceService } from './command.persistence.service';

describe('CommandPersistenceService', () => {
  let service: CommandPersistenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommandPersistenceService],
    }).compile();

    service = module.get<CommandPersistenceService>(CommandPersistenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
