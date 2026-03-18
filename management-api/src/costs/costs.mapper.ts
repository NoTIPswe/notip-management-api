import { CostData } from './costs-data';
import { CostModel } from './models/costs.model'
import { CostResponseDto } from './dto/cost.response.dto';

export class CostMapper {
    static toModel(data: CostData): CostModel {
        return{
            storageGb: data.storageGb,
            bandwidthGb: data.bandwidthGb,
        };
    }

    static toResponseDto (model: CostModel): CostResponseDto{
        return{
            storageGb: model.storageGb,
            bandwidthGb: model.bandwidthGb,
        };
    }
}