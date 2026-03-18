import { Controller, Get } from '@nestjs/common';
import { CostsService } from './costs.service';
import { CostResponseDto } from './dto/cost.response.dto';
import { CostsMapper } from './costs.mapper';
import { TenantId } from 'src/common/decorators/tenants.decorator';
import { TenantScoped } from 'src/common/decorators/access-policy.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UsersRole } from 'src/users/enums/users.enum';
 
@TenantScoped()
@Roles(UsersRole.TENANT_ADMIN)
@Controller('costs')
export class CostsController{
    constructor(private readonly cs: CostsService){}

    @Get()
    async getTenantCost(@TenantId() tenantId: string) : Promise<CostResponseDto>{
        const model = await this.cs.getTenantCost(tenantId);
        return CostsMapper.toResponseDto(model);
    }
    
}
