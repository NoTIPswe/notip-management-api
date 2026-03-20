import { CostsPersistenceService } from './costs.persistence.service';

describe('CostsPersistenceService', () => {
  it('returns static cost data', async () => {
    const service = new CostsPersistenceService();

    await expect(service.getTenantCost('tenant-1')).resolves.toEqual({
      storageGb: 120.5,
      bandwidthGb: 89.3,
    });
  });
});
