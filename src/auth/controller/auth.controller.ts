import {
  Controller,
  Get,
  Req,
  Post,
  Body,
  Req as NestReq,
  ForbiddenException,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { ImpersonationService } from '../services/impersonation.service';
import { AdminOnly } from '../../common/decorators/access-policy.decorator';
import { DataSource } from 'typeorm';
import { TenantEntity } from '../../common/entities/tenant.entity';
import { TenantStatus } from '../../common/enums/tenants.enum';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

interface ImpersonateDto {
  user_id: string;
}

interface TenantStatusDto {
  tenant_id: string;
  status: TenantStatus;
  read_only: boolean;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly impersonationService: ImpersonationService,
    @Optional() private readonly dataSource?: DataSource,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Return authenticated user claims mapped by JwtStrategy',
  })
  @ApiResponse({ status: 200, description: 'Authenticated user details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Req() req: RequestWithUser): AuthenticatedUser | undefined {
    return req.user;
  }

  @Get('tenant-status')
  @ApiOperation({
    summary: 'Resolve tenant status for the authenticated user context',
  })
  @ApiResponse({ status: 200, description: 'Tenant status information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantStatus(@Req() req: RequestWithUser): Promise<TenantStatusDto> {
    const tenantId = req.user?.effectiveTenantId;
    if (!tenantId) {
      throw new ForbiddenException('Missing tenant context');
    }

    if (!this.dataSource?.isInitialized) {
      throw new ServiceUnavailableException('Tenant status unavailable');
    }

    const tenant = await this.dataSource
      .getRepository(TenantEntity)
      .findOneBy({ id: tenantId });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const effectiveTenant = await this.reactivateTenantIfExpired(tenant);

    return {
      tenant_id: effectiveTenant.id,
      status: effectiveTenant.status,
      read_only: effectiveTenant.status === TenantStatus.SUSPENDED,
    };
  }

  private isSuspensionExpired(tenant: TenantEntity): boolean {
    return (
      tenant.status === TenantStatus.SUSPENDED &&
      !!tenant.suspensionUntil &&
      tenant.suspensionUntil.getTime() <= Date.now()
    );
  }

  private async reactivateTenantIfExpired(
    tenant: TenantEntity,
  ): Promise<TenantEntity> {
    if (!this.dataSource || !this.isSuspensionExpired(tenant)) {
      return tenant;
    }

    tenant.status = TenantStatus.ACTIVE;
    tenant.suspensionIntervalDays = null;
    tenant.suspensionUntil = null;

    return this.dataSource.getRepository(TenantEntity).save(tenant);
  }

  @Post('impersonate')
  @AdminOnly()
  @ApiOperation({ summary: 'Impersonate a tenant user (admin only)' })
  @ApiBody({ schema: { properties: { user_id: { type: 'string' } } } })
  @ApiResponse({
    status: 200,
    description: 'Impersonation token',
    schema: {
      properties: {
        access_token: { type: 'string' },
        expires_in: { type: 'number' },
      },
    },
  })
  async impersonate(
    @Body() body: ImpersonateDto,
    @NestReq() req: Request,
  ): Promise<{ access_token: string; expires_in: number }> {
    const { user_id } = body;
    return this.impersonationService.impersonateUser({
      adminAccessToken: (req.headers['authorization'] || '').replace(
        /^Bearer /,
        '',
      ),
      targetUserId: user_id,
    });
  }
}
