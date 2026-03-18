import { Injectable } from '@nestjs/common';
import { CostData } from './costs-data';


@Injectable()
export class CostPersistenceService {
    async getTenantCost(tenantId: string): Promise<CostData> {

        //da gestire con postgre config
        return {
            storageGb: 120.5,
            bandwidthGb: 89.3,
        };

    }
}
