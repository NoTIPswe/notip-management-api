import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
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
  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    if (!payload.tenant_id)
      throw new UnauthorizedException('Missing tenant_id');
    if (!payload.role) throw new UnauthorizedException('Missing role');

    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      tenantId: payload.tenant_id,
      role: payload.role,
    };
  }
}
