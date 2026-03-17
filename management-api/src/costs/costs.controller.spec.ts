import { Test, TestingModule } from '@nestjs/testing';
import { CostsController } from './costs.controller';

describe('CostsController', () => {
  let controller: CostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CostsController],
    }).compile();

    controller = module.get<CostsController>(CostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
