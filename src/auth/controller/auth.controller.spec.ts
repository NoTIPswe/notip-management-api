import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ImpersonationService } from '../services/impersonation.service';
import { UsersRole } from '../../users/enums/users.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

type GetMeRequest = Parameters<AuthController['getMe']>[0];
type ImpersonateRequest = Parameters<AuthController['impersonate']>[1];

describe('AuthController', () => {
  let controller: AuthController;
  let impersonationService: jest.Mocked<ImpersonationService>;

  beforeEach(() => {
    impersonationService = {
      impersonateUser: jest.fn(),
    } as unknown as jest.Mocked<ImpersonationService>;
    controller = new AuthController(impersonationService);
  });

  describe('getMe', () => {
    it('returns the user from the request', () => {
      const user: AuthenticatedUser = {
        actorUserId: '1',
        actorEmail: 'test@example.com',
        actorName: 'Test',
        actorRole: UsersRole.SYSTEM_ADMIN,
        actorTenantId: 'tenant-1',
        effectiveUserId: '1',
        effectiveEmail: 'test@example.com',
        effectiveName: 'Test',
        effectiveRole: UsersRole.SYSTEM_ADMIN,
        effectiveTenantId: 'tenant-1',
        isImpersonating: false,
      };
      expect(controller.getMe({ user } as GetMeRequest)).toBe(user);
    });

    it('returns undefined if no user in request', () => {
      expect(controller.getMe({} as GetMeRequest)).toBeUndefined();
    });
  });

  describe('impersonate', () => {
    it('throws UnauthorizedException if user is not system_admin', async () => {
      const user = {
        effectiveRole: UsersRole.TENANT_ADMIN,
      } as AuthenticatedUser;
      const req = { user } as unknown as ImpersonateRequest;

      await expect(
        controller.impersonate({ user_id: 'target-1' }, req),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('calls impersonationService if user is system_admin', async () => {
      const user = {
        effectiveRole: UsersRole.SYSTEM_ADMIN,
      } as AuthenticatedUser;
      const req = {
        user,
        headers: { authorization: 'Bearer admin-token' },
      } as unknown as ImpersonateRequest;
      impersonationService.impersonateUser.mockResolvedValue({
        access_token: 'imp-token',
        expires_in: 300,
      });

      const result = await controller.impersonate({ user_id: 'target-1' }, req);

      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(impersonationService.impersonateUser).toHaveBeenCalledWith({
        adminAccessToken: 'admin-token',
        targetUserId: 'target-1',
      });
      expect(result).toEqual({ access_token: 'imp-token', expires_in: 300 });
    });
  });
});
