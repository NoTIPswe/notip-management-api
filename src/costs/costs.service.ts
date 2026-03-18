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
    try {
      const cost = await this.cps.getTenantCost(tenantId);

      if (!cost) {
        throw new NotFoundException('Cost data not found for tenant');
      }
      return CostsMapper.toModel(cost);
    } catch (e: unknown) {
      if (e === 401) {
        throw new UnauthorizedException('Unauthorized');
      }
      if (e === 403) {
        throw new ForbiddenException('Forbidden');
      }
      if (e === 405) {
        throw new MethodNotAllowedException('Method not allowed');
      }
      throw e;
    }
  }
}
