import {
  ForbiddenException,
  MethodNotAllowedException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CostsService } from './costs.service';
import { CostsPersistenceService } from './costs.persistence.service';

describe('CostsService', () => {
  const tenantId = 'tenant-1';

  it('maps cost data to the domain model', async () => {
    const persistence = {
      getTenantCost: jest.fn().mockResolvedValue({
        storageGb: 120.5,
        bandwidthGb: 89.3,
      }),
    } as unknown as CostsPersistenceService;
    const service = new CostsService(persistence);

    await expect(service.getTenantCost(tenantId)).resolves.toEqual({
      storageGb: 120.5,
      bandwidthGb: 89.3,
    });
  });

  it('throws when no cost data is returned', async () => {
    const persistence = {
      getTenantCost: jest.fn().mockResolvedValue(null),
    } as unknown as CostsPersistenceService;
    const service = new CostsService(persistence);

    await expect(service.getTenantCost(tenantId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('maps known upstream status codes to Nest exceptions', async () => {
    const cases = [
      [401, UnauthorizedException],
      [403, ForbiddenException],
      [405, MethodNotAllowedException],
    ] as const;

    for (const [error, expected] of cases) {
      const persistence = {
        getTenantCost: jest.fn().mockRejectedValue(error),
      } as unknown as CostsPersistenceService;
      const service = new CostsService(persistence);

      await expect(service.getTenantCost(tenantId)).rejects.toThrow(expected);
    }
  });

  it('rethrows unknown errors', async () => {
    const error = new Error('boom');
    const persistence = {
      getTenantCost: jest.fn().mockRejectedValue(error),
    } as unknown as CostsPersistenceService;
    const service = new CostsService(persistence);

    await expect(service.getTenantCost(tenantId)).rejects.toBe(error);
  });
});
