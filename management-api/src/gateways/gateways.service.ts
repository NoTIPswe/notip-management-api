import { Injectable } from '@nestjs/common';
import { GatewayModel } from './models/gateway.model';

@Injectable()
export class GatewaysService {
  async findById(gatewayId: string): Promise<GatewayModel | null> {
    const entity = await this.gps.findById(gatewayId);
    if (!entity) return null;
    return GatewaysMapper.toGatewayModel(entity);
  }
}
