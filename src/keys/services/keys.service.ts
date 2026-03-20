import { Injectable } from '@nestjs/common';
import { GatewaysKeysPersistenceService } from './keys.persistence.service';
import { KeyModel } from '../models/key.model';
import { KeyMapper } from '../keys.mapper';

@Injectable()
export class KeysService {
  constructor(private readonly gkp: GatewaysKeysPersistenceService) {}
  async getKeys(id: string): Promise<KeyModel[]> {
    const keys = await this.gkp.getKeys(id);
    return KeyMapper.toKeyModels(keys);
  }
  async saveKeys(
    id: string,
    keyMaterial: Buffer,
    keyVersion: number,
  ): Promise<KeyModel> {
    const key = await this.gkp.saveKeys(id, keyMaterial, keyVersion);
    return KeyMapper.toKeyModels([key])[0];
  }
}
