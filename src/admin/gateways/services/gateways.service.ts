import { Injectable } from '@nestjs/common';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { GatewayModel } from '../models/gateway.model';
import {
  AddGatewayInput,
  GetGatewaysInput,
} from '../interfaces/controller-service.interfaces';
import { GatewaysMapper } from '../gateways.mapper';
import {
  AddGatewayPersistenceInput,
  GetGatewaysPersistenceInput,
} from '../interfaces/service-persistence.interfaces';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GatewaysService {
  constructor(private readonly gps: GatewaysPersistenceService) {}

  async getGateways(input: GetGatewaysInput): Promise<GatewayModel[]> {
    const persistenceInput: GetGatewaysPersistenceInput = {
      tenantId: input.tenantId,
    };
    const gateways = await this.gps.getGateways(persistenceInput);
    return gateways.map((g) => GatewaysMapper.toModel(g));
  }

  async addGateway(input: AddGatewayInput): Promise<GatewayModel> {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(input.factoryKeyHash, salt);

    const persistenceInput: AddGatewayPersistenceInput = {
      factoryId: input.factoryId,
      tenantId: input.tenantId,
      factoryKeyHash: hash,
      firmwareVersion: input.firmwareVersion,
      model: input.model,
    };
    const entity = await this.gps.addGateway(persistenceInput);
    return GatewaysMapper.toModel(entity);
  }
}
