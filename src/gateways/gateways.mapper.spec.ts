import { instanceToPlain } from 'class-transformer';
import { GatewayStatus } from './enums/gateway.enum';
import { GatewaysMapper } from './gateways.mapper';
import { GatewayModel } from './models/gateway.model';

describe('GatewaysMapper', () => {
  const model: GatewayModel = {
    id: 'gateway-1',
    name: 'Gateway A',
    status: GatewayStatus.GATEWAY_ONLINE,
    lastSeenAt: new Date('2024-01-01T10:00:00.000Z'),
    sendFrequencyMs: 45000,
    factoryKey: 'factory-key',
    factoryId: 'factory-id',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    firmwareVersion: '1.2.3',
    model: 'nx-1',
    tenantId: 'tenant-1',
    provisioned: true,
    updatedAt: new Date('2024-01-01T11:00:00.000Z'),
  };

  it('serializes gateway detail DTO using snake_case exposed keys', () => {
    const dto = GatewaysMapper.toResponseDto(model);

    expect(instanceToPlain(dto)).toEqual({
      id: 'gateway-1',
      name: 'Gateway A',
      status: 'gateway_online',
      last_seen_at: '2024-01-01T10:00:00.000Z',
      provisioned: true,
      firmware_version: '1.2.3',
      send_frequency_ms: 45000,
    });
  });

  it('serializes gateway update DTO timestamp as updated_at', () => {
    const dto = GatewaysMapper.toUpdateResponseDto(model);

    expect(instanceToPlain(dto)).toEqual({
      id: 'gateway-1',
      name: 'Gateway A',
      status: 'gateway_online',
      updated_at: '2024-01-01T11:00:00.000Z',
    });
  });
});
