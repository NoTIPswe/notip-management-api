import { Injectable } from '@nestjs/common';
import { KeyEntity } from '../entities/key.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GatewaysKeysPersistenceService {
  constructor(private readonly r: Repository<KeyEntity>) {}
  async getKeys(id: string): Promise<KeyEntity[]> {
    return this.r.find({ where: { gatewayId: id } });
  }
  async saveKeys(
    id: string,
    keyMaterial: Buffer,
    keyVersion: number,
  ): Promise<KeyEntity> {
    const key = this.r.create({
      gatewayId: id,
      keyMaterial,
      keyVersion,
    });
    return this.r.save(key);
  }
}
