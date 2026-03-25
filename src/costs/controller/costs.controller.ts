import { Controller, Get } from '@nestjs/common';
import { CostsService } from '../services/costs.service';
import { CostResponseDto } from '../dto/cost.response.dto';
import { CostsMapper } from '../costs.mapper';
import { TenantId } from '../../common/decorators/tenants.decorator';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersRole } from '../../users/enums/users.enum';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Costs')
@TenantScoped()
@Roles(UsersRole.TENANT_ADMIN)
@Controller('costs')
export class CostsController {
  constructor(private readonly cs: CostsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current costs for the tenant' })
  @ApiResponse({ status: 200, type: CostResponseDto })
  async getTenantCost(@TenantId() tenantId: string): Promise<CostResponseDto> {
    const model = await this.cs.getTenantCost(tenantId);
    return CostsMapper.toResponseDto(model);
  }
}
