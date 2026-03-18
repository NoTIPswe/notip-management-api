import { CostsMapper } from './costs.mapper';
import { CostData } from './costs-data';
import { CostModel } from './models/costs.model';

describe('CostsMapper', () => {
  it('maps cost data to model', () => {
    const data: CostData = {
      storageGb: 120.5,
      bandwidthGb: 89.3,
    };

    expect(CostsMapper.toModel(data)).toEqual({
      storageGb: 120.5,
      bandwidthGb: 89.3,
    });
  });

  it('maps model to response dto', () => {
    const model: CostModel = {
      storageGb: 240,
      bandwidthGb: 180,
    };

    expect(CostsMapper.toResponseDto(model)).toEqual({
      storageGb: 240,
      bandwidthGb: 180,
    });
  });
});
