import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersRole } from '../../users/enums/users.enum';
import { TenantId } from '../../common/decorators/tenants.decorator';
import { AuditLogResponseDto } from '../dto/audit-log.response.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditLogService } from '../services/audit.service';
import { AuditLogMapper } from '../audit.mapper';

@TenantScoped()
@Roles(UsersRole.TENANT_ADMIN)
@Controller('audit')
export class AuditLogController {
  constructor(private readonly als: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs for the tenant' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Audit logs not found' })
  async getAuditLogs(
    @TenantId() tenantId: string,
    @Query('from') from: Date,
    @Query('to') to: Date,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Req() req?: Request,
  ): Promise<AuditLogResponseDto[]> {
    if (!tenantId || !from || !to) {
      throw new BadRequestException(
        'The tenant context and query parameters "from" and "to" are required.',
      );
    }
    const logs = await this.als.getAuditLogs({
      tenantId,
      from,
      to,
      userId,
      action,
    });
    const user = req?.user as { isImpersonating?: boolean } | undefined;
    const isImpersonating = user?.isImpersonating;
    return logs.map((log) => {
      const dto = AuditLogMapper.toDto(log);
      if (isImpersonating && dto.action === 'UPDATE_GATEWAY' && dto.details) {
        if (
          dto.details.input &&
          typeof dto.details.input === 'object' &&
          'name' in dto.details.input
        ) {
          dto.details.input.name = '*** OBFUSCATED ***';
        }
        if (
          dto.details.output &&
          typeof dto.details.output === 'object' &&
          'name' in dto.details.output
        ) {
          dto.details.output.name = '*** OBFUSCATED ***';
        }
        if ('name' in dto.details) {
          dto.details.name = '*** OBFUSCATED ***';
        }
      }
      return dto;
    });
  }
}
