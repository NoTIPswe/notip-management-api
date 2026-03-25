import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GatewaysKeysPersistenceService } from './keys.persistence.service';
import { KeyModel } from '../models/key.model';
import { KeyMapper } from '../keys.mapper';
import { GatewaysService } from '../../gateways/services/gateways.service';

@Injectable()
export class KeysService {
  constructor(
    private readonly gkp: GatewaysKeysPersistenceService,
    private readonly gs: GatewaysService,
  ) {}
  async getKeys(id: string, tenantId?: string): Promise<KeyModel[]> {
    const gateway = await this.gs.findByIdUnscoped(id);
    if (!gateway) {
      throw new NotFoundException('Gateway not found');
    }

    if (tenantId && gateway.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Gateway does not belong to the requested tenant',
      );
    }

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
