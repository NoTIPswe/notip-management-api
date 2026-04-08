import { Repository } from 'typeorm';
import { CommandWritingPersistenceService } from './command-writing.persistence.service';
import { CommandEntity } from '../entities/command.entity';
import { CommandStatus } from '../enums/command-status.enum';
import { CommandType } from '../enums/command-type.enum';
import { GatewayEntity } from '../../gateways/entities/gateway.entity';
import { GatewayStatus } from '../../gateways/enums/gateway.enum';

type RepositoryMock<T> = {
  findOne: jest.Mock<Promise<T | null>, [options?: unknown]>;
  save: jest.Mock<Promise<T>, [entity: T]>;
};

const createRepositoryMock = <T>(): RepositoryMock<T> => ({
  findOne: jest.fn() as RepositoryMock<T>['findOne'],
  save: jest.fn() as RepositoryMock<T>['save'],
});

const createGatewayEntity = (
  overrides: Partial<GatewayEntity> = {},
): GatewayEntity => ({
  id: 'gateway-1',
  tenantId: 'tenant-1',
  tenant: undefined as never,
  factoryId: 'factory-1',
  factoryKeyHash: null,
  provisioned: true,
  model: 'notip-sim',
  firmwareVersion: '1.0.0',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  metadata: undefined as unknown as GatewayEntity['metadata'],
  ...overrides,
});

describe('CommandWritingPersistenceService', () => {
  it('updates existing command status', async () => {
    const repository = createRepositoryMock<CommandEntity>();
    const gatewaysRepository = createRepositoryMock<GatewayEntity>();
    const entity = {
      id: 'cmd-1',
      status: CommandStatus.QUEUED,
      ackReceivedAt: null,
    } as CommandEntity;
    repository.findOne.mockResolvedValue(entity);
    repository.save.mockResolvedValue({ ...entity, status: CommandStatus.ACK });

    const service = new CommandWritingPersistenceService(
      repository as unknown as Repository<CommandEntity>,
      gatewaysRepository as unknown as Repository<GatewayEntity>,
    );

    const timestamp = new Date('2024-01-02T00:00:00.000Z');
    const result = await service.updateStatus({
      commandId: 'cmd-1',
      status: CommandStatus.ACK,
      timestamp,
    });

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'cmd-1' } });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: CommandStatus.ACK,
        ackReceivedAt: timestamp,
      }),
    );
    expect(result?.status).toBe(CommandStatus.ACK);
  });

  it('returns null when command missing', async () => {
    const repository = createRepositoryMock<CommandEntity>();
    const gatewaysRepository = createRepositoryMock<GatewayEntity>();
    repository.findOne.mockResolvedValue(null);
    const service = new CommandWritingPersistenceService(
      repository as unknown as Repository<CommandEntity>,
      gatewaysRepository as unknown as Repository<GatewayEntity>,
    );

    await expect(
      service.updateStatus({
        commandId: 'missing',
        status: CommandStatus.ACK,
        timestamp: new Date(),
      }),
    ).resolves.toBeNull();
  });
});

it('applies config command effects to gateway metadata after ACK', async () => {
  const repository = createRepositoryMock<CommandEntity>();
  const gatewaysRepository = createRepositoryMock<GatewayEntity>();
  const gateway = createGatewayEntity({
    id: 'gateway-1',
    metadata: {
      gatewayId: 'gateway-1',
      gateway: undefined as never,
      name: 'Gateway 1',
      status: GatewayStatus.GATEWAY_ONLINE,
      sendFrequencyMs: 3000,
      lastSeenAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  });
  gatewaysRepository.findOne.mockResolvedValue(gateway);
  gatewaysRepository.save.mockResolvedValue(gateway);

  const service = new CommandWritingPersistenceService(
    repository as unknown as Repository<CommandEntity>,
    gatewaysRepository as unknown as Repository<GatewayEntity>,
  );

  await service.applyAckedCommandEffects({
    id: 'cmd-1',
    gatewayId: 'gateway-1',
    status: CommandStatus.ACK,
    type: CommandType.CONFIG,
    requestedSendFrequencyMs: 6000,
    requestedStatus: 'paused',
  } as CommandEntity);

  expect(gatewaysRepository.findOne).toHaveBeenCalledWith({
    where: { id: 'gateway-1' },
    relations: ['metadata'],
  });
  const savedGateway = gatewaysRepository.save.mock.calls.at(0)?.[0];
  expect(savedGateway?.metadata?.sendFrequencyMs).toBe(6000);
  expect(savedGateway?.metadata?.status).toBe(GatewayStatus.GATEWAY_SUSPENDED);
});

it('applies firmware command effects to gateway after ACK', async () => {
  const repository = createRepositoryMock<CommandEntity>();
  const gatewaysRepository = createRepositoryMock<GatewayEntity>();
  const gateway = createGatewayEntity({
    id: 'gateway-1',
    firmwareVersion: '1.2.5',
    metadata: undefined as unknown as GatewayEntity['metadata'],
  });
  gatewaysRepository.findOne.mockResolvedValue(gateway);
  gatewaysRepository.save.mockResolvedValue(gateway);

  const service = new CommandWritingPersistenceService(
    repository as unknown as Repository<CommandEntity>,
    gatewaysRepository as unknown as Repository<GatewayEntity>,
  );

  await service.applyAckedCommandEffects({
    id: 'cmd-2',
    gatewayId: 'gateway-1',
    status: CommandStatus.ACK,
    type: CommandType.FIRMWARE,
    requestedFirmwareVersion: '2.0.0',
  } as CommandEntity);

  const savedGateway = gatewaysRepository.save.mock.calls.at(0)?.[0];
  expect(savedGateway?.firmwareVersion).toBe('2.0.0');
});
