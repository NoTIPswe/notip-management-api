import { Test, TestingModule } from '@nestjs/testing';
import { ThresholdsController } from './thresholds.controller';

describe('ThresholdsController', () => {
  let controller: ThresholdsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThresholdsController],
    }).compile();

    controller = module.get<ThresholdsController>(ThresholdsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
