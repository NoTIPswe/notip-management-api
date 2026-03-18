import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { GatewayModel } from './gateway.model';
import {
  AddGatewayInput,
  GetGatewaysInput,
} from './interfaces/controller-service.interfaces';
import { GatewaysMapper } from './gateways.mapper';
import {
  AddGatewayPersistenceInput,
  GetGatewaysPersistenceInput,
} from './interfaces/service-persistence.interfaces';

function isDatabaseError(
  error: unknown,
  code: string,
): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === code
  );
}

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
    const persistenceInput: AddGatewayPersistenceInput = {
      factoryId: input.factoryId,
      tenantId: input.tenantId,
      factoryKeyHash: input.factoryKeyHash,
    };
    try {
      const entity = await this.gps.addGateway(persistenceInput);
      return GatewaysMapper.toModel(entity);
    } catch (e: unknown) {
      if (isDatabaseError(e, '23503'))
        throw new NotFoundException('Tenant not found');
      if (isDatabaseError(e, '23505'))
        throw new ConflictException('Factory ID already registered');
      throw e;
    }
  }
}
