import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandService } from './command.service';
import { CommandPersistenceService } from './command.persistence.service';
import { GatewaysService } from '../../gateways/services/gateways.service';
import { CommandType } from '../enums/command-type.enum';
import { CommandStatus } from '../enums/command-status.enum';
import { CommandEntity } from '../entities/command.entity';
import { JetStreamClient } from '../nats/jetstream.client';

interface PublishedCommandPayload {
  send_frequency_ms?: number;
  status?: string;
  firmware_version?: string;
  download_url?: string;
}

interface PublishedCommandEnvelope {
  command_id: string;
  type: string;
  issued_at: string;
  payload: PublishedCommandPayload;
}

const createCommandEntity = (
  overrides: Partial<CommandEntity> = {},
): CommandEntity => ({
  id: 'cmd-1',
  tenantId: 'tenant-1',
  gatewayId: 'gateway-1',
  type: CommandType.CONFIG,
  status: CommandStatus.QUEUED,
  issuedAt: new Date('2024-01-01T00:00:00.000Z'),
  ackReceivedAt: null,
  requestedSendFrequencyMs: null,
  requestedStatus: null,
  requestedFirmwareVersion: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  tenant: undefined as never,
  gateway: undefined as never,
  ...overrides,
});

const createPersistenceMock = () => ({
  queueCommand: jest.fn(),
  findCommand: jest.fn(),
});

const createGatewayServiceMock = () => ({
  findById: jest.fn(),
});

const createJetStreamMock = () => ({
  subscribe: jest.fn(),
  publish: jest
    .fn<Promise<void>, [string, Buffer]>()
    .mockResolvedValue(undefined),
});

function readFirstPublishedEnvelope(
  jetStream: ReturnType<typeof createJetStreamMock>,
): PublishedCommandEnvelope {
  const rawBuffer = jetStream.publish.mock.calls.at(0)?.[1];
  if (!(rawBuffer instanceof Buffer)) {
    throw new Error('Expected first publish payload to be a Buffer');
  }

  const parsed: unknown = JSON.parse(rawBuffer.toString('utf-8'));
  return parsed as PublishedCommandEnvelope;
}

describe('CommandService', () => {
  it('queues and publishes config commands', async () => {
    const persistence = createPersistenceMock();
    const gateways = createGatewayServiceMock();
    const jetStream = createJetStreamMock();
    persistence.queueCommand.mockResolvedValue(createCommandEntity());
    gateways.findById.mockResolvedValue({ id: 'gateway-1' });
    const service = new CommandService(
      persistence as unknown as CommandPersistenceService,
      gateways as unknown as GatewaysService,
      jetStream as unknown as JetStreamClient,
    );

    const result = await service.sendConfig({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      sendFrequencyMs: 1000,
      status: 'active',
    });

    expect(gateways.findById).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
    });
    expect(persistence.queueCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        type: CommandType.CONFIG,
        status: CommandStatus.QUEUED,
        requestedSendFrequencyMs: 1000,
        requestedStatus: 'active',
      }),
    );
    expect(jetStream.publish).toHaveBeenCalledWith(
      'command.gw.tenant-1.gateway-1',
      expect.any(Buffer),
    );
    const publishedPayload = readFirstPublishedEnvelope(jetStream);
    expect(publishedPayload).toEqual(
      expect.objectContaining({
        command_id: 'cmd-1',
        type: 'config_update',
        payload: {
          send_frequency_ms: 1000,
          status: 'active',
        },
      }),
    );
    expect(publishedPayload).toHaveProperty('issued_at');
    expect(publishedPayload.payload).not.toHaveProperty('sendFrequencyMs');
    expect(result).toEqual(
      expect.objectContaining({ id: 'cmd-1', status: CommandStatus.QUEUED }),
    );
  });

  it('requires at least one config field', async () => {
    const persistence = createPersistenceMock();
    const gateways = createGatewayServiceMock();
    const jetStream = createJetStreamMock();
    const service = new CommandService(
      persistence as unknown as CommandPersistenceService,
      gateways as unknown as GatewaysService,
      jetStream as unknown as JetStreamClient,
    );

    await expect(
      service.sendConfig({ tenantId: 'tenant-1', gatewayId: 'gateway-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('queues and publishes firmware commands', async () => {
    const persistence = createPersistenceMock();
    const gateways = createGatewayServiceMock();
    const jetStream = createJetStreamMock();
    gateways.findById.mockResolvedValue({ id: 'gateway-1' });
    persistence.queueCommand.mockResolvedValue(
      createCommandEntity({ type: CommandType.FIRMWARE }),
    );
    const service = new CommandService(
      persistence as unknown as CommandPersistenceService,
      gateways as unknown as GatewaysService,
      jetStream as unknown as JetStreamClient,
    );

    const result = await service.sendFirmware({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      firmwareVersion: '1.2.3',
      downloadUrl: 'https://example.com/fw.bin',
    });

    expect(persistence.queueCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CommandType.FIRMWARE,
        requestedFirmwareVersion: '1.2.3',
      }),
    );
    expect(jetStream.publish).toHaveBeenCalledWith(
      'command.gw.tenant-1.gateway-1',
      expect.any(Buffer),
    );
    const publishedPayload = readFirstPublishedEnvelope(jetStream);
    expect(publishedPayload).toEqual(
      expect.objectContaining({
        command_id: 'cmd-1',
        type: 'firmware_push',
        payload: {
          firmware_version: '1.2.3',
          download_url: 'https://example.com/fw.bin',
        },
      }),
    );
    expect(publishedPayload).toHaveProperty('issued_at');
    expect(publishedPayload.payload).not.toHaveProperty('firmwareVersion');
    expect(publishedPayload.payload).not.toHaveProperty('downloadUrl');
    expect(gateways.findById).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
    });
    expect(result.type).toBe(CommandType.FIRMWARE);
  });

  it('returns status for existing commands', async () => {
    const persistence = createPersistenceMock();
    const gateways = createGatewayServiceMock();
    const jetStream = createJetStreamMock();
    persistence.findCommand.mockResolvedValue(
      createCommandEntity({ status: CommandStatus.ACK }),
    );
    const service = new CommandService(
      persistence as unknown as CommandPersistenceService,
      gateways as unknown as GatewaysService,
      jetStream as unknown as JetStreamClient,
    );

    const result = await service.getStatus({
      tenantId: 'tenant-1',
      gatewayId: 'gateway-1',
      commandId: 'cmd-1',
    });

    expect(result.status).toBe(CommandStatus.ACK);
  });

  it('throws when command missing', async () => {
    const persistence = createPersistenceMock();
    const gateways = createGatewayServiceMock();
    const jetStream = createJetStreamMock();
    persistence.findCommand.mockResolvedValue(null);
    const service = new CommandService(
      persistence as unknown as CommandPersistenceService,
      gateways as unknown as GatewaysService,
      jetStream as unknown as JetStreamClient,
    );

    await expect(
      service.getStatus({
        tenantId: 'tenant-1',
        gatewayId: 'gateway-1',
        commandId: 'cmd-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
