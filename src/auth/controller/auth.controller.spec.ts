import { AuthController } from './auth.controller';
import { ImpersonationService } from '../services/impersonation.service';
import { UsersRole } from '../../users/enums/users.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { DataSource } from 'typeorm';
import { TenantStatus } from '../../common/enums/tenants.enum';

type GetMeRequest = Parameters<AuthController['getMe']>[0];
type ImpersonateRequest = Parameters<AuthController['impersonate']>[1];

describe('AuthController', () => {
  let controller: AuthController;
  let impersonationService: jest.Mocked<ImpersonationService>;
  let dataSource: jest.Mocked<DataSource>;
  let findOneBy: jest.Mock;
  let save: jest.Mock;

  beforeEach(() => {
    impersonationService = {
      impersonateUser: jest.fn(),
    } as unknown as jest.Mocked<ImpersonationService>;
    findOneBy = jest.fn();
    save = jest.fn();
    dataSource = {
      isInitialized: true,
      getRepository: jest.fn().mockReturnValue({ findOneBy, save }),
    } as unknown as jest.Mocked<DataSource>;

    controller = new AuthController(impersonationService, dataSource);
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
    it('calls impersonationService with an empty token if authorization header is missing', async () => {
      const user = {
        effectiveRole: UsersRole.TENANT_ADMIN,
      } as AuthenticatedUser;
      const req = {
        user,
        headers: {},
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as ImpersonateRequest;
      impersonationService.impersonateUser.mockResolvedValue({
        access_token: 'imp-token',
        expires_in: 300,
      });

      await controller.impersonate({ user_id: 'target-1' }, req);

      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(impersonationService.impersonateUser).toHaveBeenCalledWith({
        adminAccessToken: '',
        targetUserId: 'target-1',
      });
    });

    it('calls impersonationService if user is system_admin', async () => {
      const user = {
        effectiveRole: UsersRole.SYSTEM_ADMIN,
      } as AuthenticatedUser;
      const req = {
        user,
        headers: { authorization: 'Bearer admin-token' },
        get: jest.fn().mockReturnValue('Bearer admin-token'),
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

  describe('getTenantStatus', () => {
    it('returns tenant status and read-only flag', async () => {
      findOneBy.mockResolvedValue({
        id: 'tenant-1',
        status: TenantStatus.SUSPENDED,
      });

      await expect(
        controller.getTenantStatus({
          user: {
            effectiveTenantId: 'tenant-1',
          },
        } as GetMeRequest),
      ).resolves.toEqual({
        tenant_id: 'tenant-1',
        status: TenantStatus.SUSPENDED,
        read_only: true,
      });
    });

    it('throws when tenant context is missing', async () => {
      await expect(
        controller.getTenantStatus({
          user: {
            effectiveTenantId: undefined,
          },
        } as GetMeRequest),
      ).rejects.toThrow('Missing tenant context');
    });

    it('throws when tenant is not found', async () => {
      findOneBy.mockResolvedValue(null);

      await expect(
        controller.getTenantStatus({
          user: {
            effectiveTenantId: 'tenant-404',
          },
        } as GetMeRequest),
      ).rejects.toThrow('Tenant not found');
    });

    it('reactivates tenant when suspension is expired', async () => {
      findOneBy.mockResolvedValue({
        id: 'tenant-1',
        status: TenantStatus.SUSPENDED,
        suspensionUntil: new Date(Date.now() - 60_000),
        suspensionIntervalDays: 7,
      });
      save.mockResolvedValue({
        id: 'tenant-1',
        status: TenantStatus.ACTIVE,
        suspensionUntil: null,
        suspensionIntervalDays: null,
      });

      await expect(
        controller.getTenantStatus({
          user: {
            effectiveTenantId: 'tenant-1',
          },
        } as GetMeRequest),
      ).resolves.toEqual({
        tenant_id: 'tenant-1',
        status: TenantStatus.ACTIVE,
        read_only: false,
      });
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TenantStatus.ACTIVE,
          suspensionUntil: null,
          suspensionIntervalDays: null,
        }),
      );
    });
  });
});
