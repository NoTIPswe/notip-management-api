import { Controller, Get, Query } from '@nestjs/common';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { BlockImpersonation } from '../../common/decorators/block-impersonation.decorator';
import { KeysService } from '../services/keys.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KeysResponseDto } from '../dto/keys.response.dto';
import { KeyMapper } from '../keys.mapper';
import { TenantId } from '../../common/decorators/tenants.decorator';

@TenantScoped()
@BlockImpersonation()
@Controller('keys')
export class KeysController {
  constructor(private readonly ks: KeysService) {}

  @Get()
  @ApiOperation({ summary: 'Get all keys for a gateway' })
  @ApiResponse({
    status: 200,
    description: 'List of keys',
    type: KeysResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Gateway not found' })
  async getKeys(
    @TenantId() tenantId: string,
    @Query('id') id: string,
  ): Promise<KeysResponseDto[]> {
    const models = await this.ks.getKeys(id, tenantId);
    return models.map((model) => KeyMapper.toDto(model));
  }
}
