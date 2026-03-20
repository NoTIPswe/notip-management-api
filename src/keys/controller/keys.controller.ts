import { Controller, Get, Query } from '@nestjs/common';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { KeysService } from '../services/keys.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@TenantScoped()
@Controller('keys')
export class KeysController {
  constructor(private readonly ks: KeysService) {}
  @Get()
  @ApiOperation({ summary: 'Get all keys for a gateway' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Gateway not found' })
  async getKeys(@Query('id') id: string) {
    return this.ks.getKeys(id);
  }
}
