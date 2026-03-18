import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UsersRole } from 'src/users/enums/users.enum';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  tenant_id?: string;
  is_impersonating?: boolean;
  actor_user_id?: string;
  actor_email?: string;
  actor_name?: string;
  actor_role?: string;
  actor_tenant_id?: string;
}

const isUsersRole = (value: string): value is UsersRole =>
  Object.values(UsersRole).includes(value as UsersRole);

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        cacheMaxAge: 24 * 60 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get<string>('KEYCLOAK_URL')}/realms/${configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/certs`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get<string>('KEYCLOAK_MGMT_CLIENT_ID'),
      issuer: `${configService.get('KEYCLOAK_URL')}/realms/${configService.get('KEYCLOAK_REALM')}`,
      algorithms: ['RS256'],
    });
  }
  validate(payload: JwtClaims): AuthenticatedUser {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    if (!payload.role || !isUsersRole(payload.role)) {
      throw new UnauthorizedException('Missing role');
    }

    if (payload.role !== UsersRole.SYSTEM_ADMIN && !payload.tenant_id) {
      throw new UnauthorizedException('Missing tenant_id');
    }

    const isImpersonating = payload.is_impersonating === true;
    const actorUserId = isImpersonating ? payload.actor_user_id : payload.sub;
    const actorEmail = isImpersonating ? payload.actor_email : payload.email;
    const actorName = isImpersonating ? payload.actor_name : payload.name;
    const actorRole = isImpersonating ? payload.actor_role : payload.role;
    const actorTenantId = isImpersonating
      ? payload.actor_tenant_id
      : payload.tenant_id;

    if (!actorUserId || !actorRole || !isUsersRole(actorRole)) {
      throw new UnauthorizedException('Missing impersonation actor claims');
    }

    return {
      actorUserId,
      actorEmail,
      actorName,
      actorRole,
      actorTenantId,
      effectiveUserId: payload.sub,
      effectiveEmail: payload.email,
      effectiveName: payload.name,
      effectiveRole: payload.role,
      effectiveTenantId: payload.tenant_id,
      isImpersonating,
    };
  }
}
