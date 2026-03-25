import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

interface KeycloakTokenResponse {
  access_token: string;
  expires_in?: number;
}

@Injectable()
export class ImpersonationService {
  constructor(private readonly config: ConfigService) {}

  async impersonateUser({
    adminAccessToken,
    targetUserId,
  }: {
    adminAccessToken: string;
    targetUserId: string;
  }): Promise<{ access_token: string; expires_in: number }> {
    const keycloakUrl = this.config.get<string>('KEYCLOAK_URL');
    const keycloakRealm = this.config.get<string>('KEYCLOAK_REALM');
    const clientId = this.config.get<string>('KEYCLOAK_MGMT_CLIENT_ID');
    const clientSecret = this.config.get<string>('KEYCLOAK_MGMT_CLIENT_SECRET');
    if (!keycloakUrl || !keycloakRealm || !clientId || !clientSecret) {
      throw new InternalServerErrorException('Keycloak config missing');
    }

    const tokenUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;
    const params = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: adminAccessToken,
      requested_subject: targetUserId,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new UnauthorizedException(
        `Keycloak token exchange failed: ${res.status} ${text}`,
      );
    }
    const data = (await res.json()) as KeycloakTokenResponse;
    if (!data.access_token) {
      throw new InternalServerErrorException(
        'No access_token in token exchange response',
      );
    }
    return {
      access_token: data.access_token,
      expires_in: data.expires_in ?? 300,
    };
  }
}
