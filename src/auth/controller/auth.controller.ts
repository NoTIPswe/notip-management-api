import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Get('me')
  @ApiOperation({
    summary: 'Return authenticated user claims mapped by JwtStrategy',
  })
  @ApiResponse({ status: 200, description: 'Authenticated user details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Req() req: RequestWithUser): AuthenticatedUser | undefined {
    return req.user;
  }
}
