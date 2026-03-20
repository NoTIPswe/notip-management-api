import { Injectable } from '@nestjs/common';
import { CostData } from '../costs-data';

@Injectable()
export class CostsPersistenceService {
  async getTenantCost(tenantId: string): Promise<CostData> {
    void tenantId;
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      storageGb: 120.5,
      bandwidthGb: 89.3,
    };
  }
}
