import { TenantStatus } from '../../common/enums/tenants.enum';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

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
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'tenant-1',
        name: 'Tenant One',
      }),
    );
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
