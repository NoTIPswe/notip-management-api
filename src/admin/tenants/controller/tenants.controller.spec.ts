import { TenantStatus } from '../../../common/enums/tenants.enum';
import { TenantsController } from '../controller/tenants.controller';
import { TenantsService } from '../services/tenants.service';

const tenantModel = {
  id: 'tenant-1',
  name: 'Tenant One',
  status: TenantStatus.ACTIVE,
  suspensionIntervalDays: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
};

describe('TenantsController', () => {
  it('returns mapped tenants', async () => {
    const service = {
      getTenants: jest.fn().mockResolvedValue([tenantModel]),
    } as unknown as TenantsService;
    const controller = new TenantsController(service);

    await expect(controller.getTenants()).resolves.toEqual([
      expect.objectContaining({
        id: 'tenant-1',
        name: 'Tenant One',
        status: TenantStatus.ACTIVE,
      }),
    ]);
  });

  it('creates a tenant and maps the response', async () => {
    const service = {
      createTenant: jest.fn().mockResolvedValue(tenantModel),
    } as unknown as TenantsService;
    const controller = new TenantsController(service);

    await expect(
      controller.createTenant({
        name: 'Tenant One',
        adminEmail: 'admin@example.com',
        adminName: 'Admin User',
        adminPassword: 'Passw0rd!',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'tenant-1',
        name: 'Tenant One',
      }),
    );
  });

  it('returns tenant users', async () => {
    const getTenantUsersMock = jest
      .fn()
      .mockResolvedValue([{ user_id: 'user-1', role: 'tenant_admin' }]);
    const service = {
      getTenantUsers: getTenantUsersMock,
    } as unknown as TenantsService;
    const controller = new TenantsController(service);

    await expect(controller.getTenantUsers('tenant-1')).resolves.toEqual([
      { user_id: 'user-1', role: 'tenant_admin' },
    ]);
    expect(getTenantUsersMock).toHaveBeenCalledWith('tenant-1');
  });

  it('updates a tenant and maps the response', async () => {
    const service = {
      updateTenant: jest.fn().mockResolvedValue(tenantModel),
    } as unknown as TenantsService;
    const controller = new TenantsController(service);

    await expect(
      controller.updateTenant('tenant-1', {
        name: 'Tenant One',
        status: TenantStatus.ACTIVE,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'tenant-1',
        name: 'Tenant One',
      }),
    );
  });

  it('delegates tenant deletion to the service', async () => {
    const deleteTenantMock = jest.fn().mockResolvedValue(undefined);
    const service = {
      deleteTenant: deleteTenantMock,
    } as unknown as TenantsService;
    const controller = new TenantsController(service);

    await expect(controller.deleteTenant('tenant-1')).resolves.toBeUndefined();
    expect(deleteTenantMock).toHaveBeenCalledWith({ id: 'tenant-1' });
  });
});
