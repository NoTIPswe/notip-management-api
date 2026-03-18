import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  MethodNotAllowedException,
} from '@nestjs/common';
import { CostsPersistenceService } from './costs.persistence.service';
import { CostModel } from './models/costs.model';
import { CostsMapper } from './costs.mapper';

@Injectable()
export class CostsService {
  constructor(private readonly cps: CostsPersistenceService) {}

  async getTenantCost(tenantId: string): Promise<CostModel> {
    try{
        const cost = await this.cps.getTenantCost(tenantId);

        if (!cost) {
        throw new NotFoundException('Cost data not found for tenant');
        }
        return CostsMapper.toModel(cost);
    }catch(e){
        if(e?.status === 401){
            throw new UnauthorizedException('Unauthorized');
        }
        if(e?.status === 403){
            throw new ForbiddenException('Forbidden');
        }
        if(e?.status === 405){
            throw new MethodNotAllowedException('Method not allowed');
        }
        throw e;
    }
  }


}

