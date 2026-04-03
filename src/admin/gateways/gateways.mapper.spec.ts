import { GatewaysMapper } from './gateways.mapper';
import { GatewayEntity } from '../../gateways/entities/gateway.entity';
import { AddGatewayRequestDto } from './dto/add-gateway.request.dto';
import { GatewayModel } from './models/gateway.model';

describe('GatewaysMapper', () => {
  it('toModel maps entity to model correctly', () => {
    const entity = {
      id: 'gw-1',
      factoryId: 'factory-1',
      factoryKeyHash: 'hash-1',
      createdAt: new Date(),
      firmwareVersion: '1.0.0',
      model: 'M1',
      tenant: { id: 'tenant-1' },
      provisioned: true,
    } as unknown as GatewayEntity;

    const model = GatewaysMapper.toModel(entity);

    expect(model.id).toBe(entity.id);
    expect(model.tenantId).toBe('tenant-1');
  });

  it('toModel handles missing tenant gracefully', () => {
    const entity = {
      id: 'gw-1',
      tenant: null,
    } as unknown as GatewayEntity;

    const model = GatewaysMapper.toModel(entity);
    expect(model.tenantId).toBe('');
  });

  it('toResponseDto maps model to dto', () => {
    const model = new GatewayModel();
    model.id = 'gw-1';
    model.tenantId = 'tenant-1';

    const dto = GatewaysMapper.toResponseDto(model);
    expect(dto.id).toBe(model.id);
    expect(dto.tenantId).toBe(model.tenantId);
  });

  it('toAddGatewayInput maps dto to input', () => {
    const dto: AddGatewayRequestDto = {
      factoryId: 'f1',
      tenantId: 't1',
      factoryKey: 'k1',
      model: 'M1',
    };
    const input = GatewaysMapper.toAddGatewayInput(dto);
    expect(input.factoryId).toBe(dto.factoryId);
  });

  it('toAddGatewayResponseDto maps model to add response dto', () => {
    const model = new GatewayModel();
    model.id = 'gw-1';
    const dto = GatewaysMapper.toAddGatewayResponseDto(model);
    expect(dto.id).toBe(model.id);
  });
});
