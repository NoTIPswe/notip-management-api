import {
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImpersonationService } from './impersonation.service';
import fetch, { Response as FetchResponse } from 'node-fetch';
/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
const { Response } = jest.requireActual('node-fetch');

jest.mock('node-fetch');

describe('ImpersonationService', () => {
  let service: ImpersonationService;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    config = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
    service = new ImpersonationService(config);
  });

  describe('impersonateUser', () => {
    it('throws when config is missing', async () => {
      config.get.mockReturnValue(undefined);

      await expect(
        service.impersonateUser({
          adminAccessToken: 'token',
          targetUserId: 'target',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('performs token exchange successfully', async () => {
      config.get.mockImplementation((key: string) => {
        const env: Record<string, string> = {
          KEYCLOAK_URL: 'http://localhost:8080',
          KEYCLOAK_REALM: 'notip',
          KEYCLOAK_MGMT_CLIENT_ID: 'client',
          KEYCLOAK_MGMT_CLIENT_SECRET: 'secret',
        };
        return env[key];
      });

      jest.mocked(fetch).mockResolvedValue(
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-call */
        new Response(
          JSON.stringify({
            access_token: 'new-token',
            expires_in: 3600,
          }),
          { status: 200 },
        ) as FetchResponse,
      );

      const result = await service.impersonateUser({
        adminAccessToken: 'admin-token',
        targetUserId: 'target-uuid',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/protocol/openid-connect/token'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(Object) as unknown, // URLSearchParams
        }),
      );

      const fetchArgs = jest.mocked(fetch).mock.calls[0]?.[1] as {
        body: URLSearchParams;
      };
      expect(fetchArgs.body.get('grant_type')).toBe(
        'urn:ietf:params:oauth:grant-type:token-exchange',
      );
      expect(fetchArgs.body.get('subject_token_type')).toBe(
        'urn:ietf:params:oauth:token-type:access_token',
      );
      expect(fetchArgs.body.get('requested_token_type')).toBe(
        'urn:ietf:params:oauth:token-type:access_token',
      );
      expect(result).toEqual({ access_token: 'new-token', expires_in: 3600 });
    });

    it('throws UnauthorizedException if Keycloak returns error', async () => {
      config.get.mockReturnValue('value');
      jest
        .mocked(fetch)

        .mockResolvedValue(
          /* eslint-disable-next-line @typescript-eslint/no-unsafe-call */
          new Response('Error', { status: 400 }) as FetchResponse,
        );

      await expect(
        service.impersonateUser({
          adminAccessToken: 'token',
          targetUserId: 'target',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
