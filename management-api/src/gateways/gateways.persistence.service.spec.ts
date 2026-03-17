import { Test, TestingModule } from '@nestjs/testing';
import { GatewaysPersistenceService } from './gateways.persistence.service';

describe('GatewaysPersistenceService', () => {
  let service: GatewaysPersistenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GatewaysPersistenceService],
    }).compile();

    service = module.get<GatewaysPersistenceService>(GatewaysPersistenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
