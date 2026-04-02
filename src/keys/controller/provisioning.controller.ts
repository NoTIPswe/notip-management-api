import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KeysService } from '../services/keys.service';
import {
  ValidateFactoryKeyRequestDto,
  ValidateFactoryKeyResponseDto,
} from '../dto/provisioning.dto';
import { Public } from '../../common/decorators/access-policy.decorator';

@ApiTags('Internal Provisioning')
@Public()
@Controller('internal/provisioning')
export class ProvisioningController {
  constructor(private readonly ks: KeysService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate factory key' })
  @ApiResponse({ status: 200, type: ValidateFactoryKeyResponseDto })
  @ApiResponse({ status: 401, description: 'INVALID' })
  @ApiResponse({ status: 409, description: 'ALREADY_PROVISIONED' })
  async validate(
    @Body() dto: ValidateFactoryKeyRequestDto,
  ): Promise<ValidateFactoryKeyResponseDto> {
    const result = await this.ks.validateFactoryKey(
      dto.factory_id,
      dto.factory_key,
    );
    return {
      gateway_id: result.gatewayId,
      tenant_id: result.tenantId,
    };
  }
}
