import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KeysService } from '../services/keys.service';
import {
  ProvisioningCompleteRequestDto,
  ProvisioningCompleteResponseDto,
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

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete provisioning' })
  @ApiResponse({ status: 200, type: ProvisioningCompleteResponseDto })
  @ApiResponse({ status: 404, description: 'Gateway not found' })
  async complete(
    @Body() dto: ProvisioningCompleteRequestDto,
  ): Promise<ProvisioningCompleteResponseDto> {
    await this.ks.completeProvisioning(
      dto.gateway_id,
      dto.key_material,
      dto.key_version,
      dto.send_frequency_ms,
    );
    return { success: true };
  }
}
