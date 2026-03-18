import { Controller, Get, Param } from '@nestjs/common';
import { CostService } from './costs.service';
import { CostResponseDto } from './dto/cost.response.dto';
import { CostMapper } from './costs.mapper';
import { TenantId } from 'src/common/decorators/tenants.decorator';
 
@Controller('costs')
export class CostController{
    constructor(private readonly cs: CostService){}

    @Get()
    async getTenantCost(@TenantId() tenantId: string) : Promise<CostResponseDto>{
        const model = await this.cs.getTenantCost(tenantId);
        return CostMapper.toResponseDto(model);
    }
    
}