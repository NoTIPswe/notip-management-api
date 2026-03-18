import { Injectable } from '@nestjs/common';
import { GatewayEntity } from 'src/common/entities/gateway.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GatewaysPersistenceService {
  constructor(private readonly r: Repository<GatewayEntity>) {}

  async findById(gatewayId: string): Promise<GatewayEntity | null> {
    return this.r.findOne({
      where: { id: gatewayId },
      relations: ['tenant', 'metadata'],
    });
  }
}
