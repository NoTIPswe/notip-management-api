import { Test, TestingModule } from '@nestjs/testing';
import { ApiClientController } from './api-client.controller';

describe('ApiClientController', () => {
  let controller: ApiClientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiClientController],
    }).compile();

    controller = module.get<ApiClientController>(ApiClientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
