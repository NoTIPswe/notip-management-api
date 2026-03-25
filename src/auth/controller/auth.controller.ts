import {
  Controller,
  Get,
  Req,
  Post,
  Body,
  UnauthorizedException,
  Req as NestReq,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { ImpersonationService } from '../services/impersonation.service';
import { UsersRole } from '../../users/enums/users.enum';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

interface ImpersonateDto {
  user_id: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly impersonationService: ImpersonationService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Return authenticated user claims mapped by JwtStrategy',
  })
  @ApiResponse({ status: 200, description: 'Authenticated user details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Req() req: RequestWithUser): AuthenticatedUser | undefined {
    return req.user;
  }

  @Post('impersonate')
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
    const user = req.user as AuthenticatedUser;
    if (!user || user.effectiveRole !== (UsersRole.SYSTEM_ADMIN as UsersRole)) {
      throw new UnauthorizedException('Only system_admin can impersonate');
    }
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
