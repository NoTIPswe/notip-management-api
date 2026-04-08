import { instanceToPlain } from 'class-transformer';
import { CommandMapper } from './command.mapper';
import { CommandStatus } from './enums/command-status.enum';
import { CommandType } from './enums/command-type.enum';

describe('CommandMapper', () => {
  const model = {
    id: 'cmd-1',
    tenantId: 'tenant-1',
    gatewayId: 'gateway-1',
    type: CommandType.CONFIG,
    status: CommandStatus.ACK,
    issuedAt: new Date('2024-01-01T10:00:00.000Z'),
    ackReceivedAt: new Date('2024-01-01T10:00:03.000Z'),
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
  };

  it('serializes command response using snake_case exposed keys', () => {
    const dto = CommandMapper.toCommandResponseDto(model);

    expect(instanceToPlain(dto)).toEqual({
      command_id: 'cmd-1',
      status: 'ack',
      issued_at: '2024-01-01T10:00:00.000Z',
    });
  });

  it('serializes command status response using snake_case command id', () => {
    const dto = CommandMapper.toCommandStatusResponseDto(model);

    expect(instanceToPlain(dto)).toEqual({
      command_id: 'cmd-1',
      status: 'ack',
      timestamp: '2024-01-01T10:00:03.000Z',
    });
  });
});
