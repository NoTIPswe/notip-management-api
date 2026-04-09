import { CurrentUserId, CurrentUserRole, TenantId } from './tenants.decorator';

describe('Tenant Decorators', () => {
  it('should define TenantId decorator', () => {
    expect(TenantId).toBeDefined();
  });

  it('should define CurrentUserId decorator', () => {
    expect(CurrentUserId).toBeDefined();
  });

  it('should define CurrentUserRole decorator', () => {
    expect(CurrentUserRole).toBeDefined();
  });
});
