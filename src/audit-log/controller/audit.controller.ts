import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersRole } from '../../users/enums/users.enum';
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
    @Query('from') from: Date,
    @Query('to') to: Date,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ): Promise<AuditLogResponseDto[]> {
    if (!from || !to) {
      throw new BadRequestException(
        'The query parameters "from" and "to" are required.',
      );
    }
    const logs = await this.als.getAuditLogs({ from, to, userId, action });
    return logs.map((log) => AuditLogMapper.toDto(log));
  }
}
