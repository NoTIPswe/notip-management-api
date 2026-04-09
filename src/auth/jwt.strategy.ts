import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UsersRole } from '../users/enums/users.enum';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<
    string,
    {
      roles?: string[];
    }
  >;
  azp?: string;
  tenant_id?: string;
  act?: {
    sub?: string;
    role?: string;
  };
  is_impersonating?: boolean;
  actor_user_id?: string;
  actor_email?: string;
  actor_name?: string;
  actor_role?: string;
  actor_tenant_id?: string;
}

const isUsersRole = (value: string): value is UsersRole =>
  Object.values(UsersRole).includes(value as UsersRole);

const normalizeRole = (value?: string): UsersRole | undefined => {
  if (!value) return undefined;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return isUsersRole(normalized) ? normalized : undefined;
};

const resolveSingleRole = (
  roles: string[],
  missingRoleMessage = 'Missing role',
): UsersRole => {
  const normalizedRoles = new Set(
    roles
      .map((role) => normalizeRole(role))
      .filter((role): role is UsersRole => role !== undefined),
  );

  if (normalizedRoles.size === 0) {
    throw new UnauthorizedException(missingRoleMessage);
  }

  if (normalizedRoles.size > 1) {
    throw new UnauthorizedException('Ambiguous role claims');
  }

  return [...normalizedRoles][0];
};

const extractEffectiveRole = (
  payload: JwtClaims,
  clientId: string,
): UsersRole => {
  const explicitRole = normalizeRole(payload.role);
  if (explicitRole) {
    return explicitRole;
  }

  const candidateRoles: string[] = [];

  const tokenClientId = clientId || payload.azp;
  if (tokenClientId) {
    candidateRoles.push(
      ...(payload.resource_access?.[tokenClientId]?.roles ?? []),
    );
  }

  candidateRoles.push(...(payload.realm_access?.roles ?? []));

  return resolveSingleRole(candidateRoles);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly managementClientId: string;

  constructor(configService: ConfigService) {
    const keycloakUrl = configService.get<string>('KEYCLOAK_URL') ?? '';
    const keycloakRealm = configService.get<string>('KEYCLOAK_REALM') ?? '';
    const keycloakIssuerUrl =
      configService.get<string>('KEYCLOAK_ISSUER_URL') ??
      `${keycloakUrl}/realms/${keycloakRealm}`;
    const managementClientId =
      configService.get<string>('KEYCLOAK_MGMT_CLIENT_ID') ?? '';
    const normalizedKeycloakUrl = keycloakUrl.replace(/\/$/, '');
    const normalizedIssuerUrl = keycloakIssuerUrl.replace(/\/$/, '');

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        cacheMaxAge: 24 * 60 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${normalizedKeycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: managementClientId,
      issuer: normalizedIssuerUrl,
      algorithms: ['RS256'],
    });

    this.managementClientId = managementClientId;
  }
  validate(payload: JwtClaims): AuthenticatedUser {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    const effectiveRole = extractEffectiveRole(
      payload,
      this.managementClientId,
    );

    if (effectiveRole !== UsersRole.SYSTEM_ADMIN && !payload.tenant_id) {
      throw new UnauthorizedException('Missing tenant_id');
    }

    const isImpersonating =
      !!payload.act && !!payload.act.sub && payload.act.sub !== payload.sub;
    const actorUserId = isImpersonating
      ? payload.act?.sub
      : payload.actor_user_id || payload.sub;
    const actorEmail = payload.actor_email || payload.email;
    const actorName = payload.actor_name || payload.name;
    // Usa sempre effectiveRole come ruolo dell'attore, ignora act.role
    const actorRole = effectiveRole;
    const actorTenantId = payload.actor_tenant_id || payload.tenant_id;

    if (!actorUserId) {
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
      effectiveRole,
      effectiveTenantId: payload.tenant_id,
      isImpersonating,
    };
  }
}
