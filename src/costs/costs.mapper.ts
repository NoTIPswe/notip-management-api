import { CostData } from './costs-data';
import { CostModel } from './models/costs.model';
import { CostResponseDto } from './dto/cost.response.dto';

export class CostsMapper {
  static toModel(data: CostData): CostModel {
    const model = new CostModel();
    model.storageGb = data.storageGb;
    model.bandwidthGb = data.bandwidthGb;
    return model;
  }

  static toResponseDto(model: CostModel): CostResponseDto {
    const dto = new CostResponseDto();
    dto.storageGb = model.storageGb;
    dto.bandwidthGb = model.bandwidthGb;
    return dto;
  }
}
