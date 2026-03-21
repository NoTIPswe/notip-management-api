import { CommandController } from './command.controller';
import { CommandService } from '../services/command.service';
import { CommandStatus } from '../enums/command-status.enum';
import { CommandType } from '../enums/command-type.enum';
import { CommandModel } from '../models/command.model';

const createCommandModel = (
  overrides: Partial<CommandModel> = {},
): CommandModel => ({
  id: 'cmd-1',
  tenantId: 'tenant-1',
  gatewayId: 'gateway-1',
  type: CommandType.CONFIG,
  status: CommandStatus.QUEUED,
  issuedAt: new Date('2024-01-01T00:00:00.000Z'),
  ackReceivedAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

const createServiceMock = () => ({
  sendConfig: jest.fn(),
  sendFirmware: jest.fn(),
  getStatus: jest.fn(),
});

describe('CommandController', () => {
  it('maps send config responses to dto', async () => {
    const service = createServiceMock();
    service.sendConfig.mockResolvedValue(createCommandModel());
    const controller = new CommandController(
      service as unknown as CommandService,
    );

    const response = await controller.sendConfig('tenant-1', 'gateway-1', {
      sendFrequencyMs: 1000,
      status: 'active',
    });

    expect(service.sendConfig).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      sendFrequencyMs: 1000,
      status: 'active',
    });
    expect(response).toEqual(
      expect.objectContaining({
        commandId: 'cmd-1',
        status: CommandStatus.QUEUED,
      }),
    );
  });

  it('maps firmware responses to dto', async () => {
    const service = createServiceMock();
    service.sendFirmware.mockResolvedValue(
      createCommandModel({
        type: CommandType.FIRMWARE,
      }),
    );
    const controller = new CommandController(
      service as unknown as CommandService,
    );

    const response = await controller.sendFirmware('tenant-1', 'gateway-1', {
      firmwareVersion: '1.2.3',
      downloadUrl: 'https://example.com/fw.bin',
    });

    expect(service.sendFirmware).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      firmwareVersion: '1.2.3',
      downloadUrl: 'https://example.com/fw.bin',
    });
    expect(response.commandId).toBe('cmd-1');
  });

  it('maps status responses to dto', async () => {
    const service = createServiceMock();
    service.getStatus.mockResolvedValue(
      createCommandModel({
        status: CommandStatus.ACK,
        ackReceivedAt: new Date('2024-01-02T00:00:00.000Z'),
      }),
    );
    const controller = new CommandController(
      service as unknown as CommandService,
    );

    const response = await controller.getStatus(
      'tenant-1',
      'gateway-1',
      'cmd-1',
    );

    expect(service.getStatus).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      commandId: 'cmd-1',
    });
    expect(response).toEqual(
      expect.objectContaining({ status: CommandStatus.ACK }),
    );
  });
});
