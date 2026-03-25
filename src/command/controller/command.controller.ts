import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersRole } from '../../users/enums/users.enum';
import { TenantId } from '../../common/decorators/tenants.decorator';
import { CommandService } from '../services/command.service';
import { SendConfigRequestDto } from '../dto/send-config.request.dto';
import { SendFirmwareRequestDto } from '../dto/send-firmware.request.dto';
import { CommandResponseDto } from '../dto/command.response.dto';
import { CommandStatusResponseDto } from '../dto/command-status.response.dto';
import { CommandMapper } from '../command.mapper';
import { Audit } from '../../common/decorators/audit.decorator';
import { BlockImpersonation } from '../../common/decorators/block-impersonation.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Commands')
@TenantScoped()
@BlockImpersonation()
@Controller('cmd')
export class CommandController {
  constructor(private readonly cs: CommandService) {}

  @Post(':gatewayId/config')
  @Audit({ action: 'SEND_CONFIG', resource: 'Commands' })
  @Roles(UsersRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Send configuration to a gateway' })
  @ApiResponse({ status: 202, type: CommandResponseDto })
  async sendConfig(
    @TenantId() tenantId: string,
    @Param('gatewayId') gatewayId: string,
    @Body() dto: SendConfigRequestDto,
  ): Promise<CommandResponseDto> {
    const model = await this.cs.sendConfig({
      tenantId,
      gatewayId,
      sendFrequencyMs: dto.sendFrequencyMs,
      status: dto.status,
    });
    return CommandMapper.toCommandResponseDto(model);
  }

  @Post(':gatewayId/firmware')
  @Audit({ action: 'SEND_FIRMWARE', resource: 'Commands' })
  @Roles(UsersRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Send firmware update to a gateway' })
  @ApiResponse({ status: 202, type: CommandResponseDto })
  async sendFirmware(
    @TenantId() tenantId: string,
    @Param('gatewayId') gatewayId: string,
    @Body() dto: SendFirmwareRequestDto,
  ): Promise<CommandResponseDto> {
    const model = await this.cs.sendFirmware({
      tenantId,
      gatewayId,
      firmwareVersion: dto.firmwareVersion,
      downloadUrl: dto.downloadUrl,
    });
    return CommandMapper.toCommandResponseDto(model);
  }

  @Get(':gatewayId/status/:commandId')
  @Roles(UsersRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get command execution status' })
  @ApiResponse({ status: 200, type: CommandStatusResponseDto })
  async getStatus(
    @TenantId() tenantId: string,
    @Param('gatewayId') gatewayId: string,
    @Param('commandId') commandId: string,
  ): Promise<CommandStatusResponseDto> {
    const model = await this.cs.getStatus({
      tenantId,
      gatewayId,
      commandId,
    });
    return CommandMapper.toCommandStatusResponseDto(model);
  }
}
