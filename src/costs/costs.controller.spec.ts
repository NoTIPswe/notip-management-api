import { CostsController } from './costs.controller';
import { CostsService } from './costs.service';

describe('CostsController', () => {
  it('returns a mapped cost response', async () => {
    const getTenantCostMock = jest.fn().mockResolvedValue({
      storageGb: 120.5,
      bandwidthGb: 89.3,
    });
    const service = {
      getTenantCost: getTenantCostMock,
    } as unknown as CostsService;
    const controller = new CostsController(service);

    await expect(controller.getTenantCost('tenant-1')).resolves.toEqual({
      storageGb: 120.5,
      bandwidthGb: 89.3,
    });
    expect(getTenantCostMock).toHaveBeenCalledWith('tenant-1');
  });
});
