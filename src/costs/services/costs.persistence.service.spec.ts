import { Test, TestingModule } from '@nestjs/testing';
import { CostsPersistenceService } from './costs.persistence.service';
import { JetStreamClient } from '../../nats/jetstream.client';
import { AlertsPersistenceService } from '../../alerts/services/alerts.persistence.service';
import { CommandPersistenceService } from '../../command/services/command.persistence.service';

describe('CostsPersistenceService', () => {
  let service: CostsPersistenceService;
  let natsMock: jest.Mocked<JetStreamClient>;
  let alertsMock: jest.Mocked<AlertsPersistenceService>;
  let commandsMock: jest.Mocked<CommandPersistenceService>;

  beforeEach(async () => {
    natsMock = {
      request: jest.fn(),
    } as unknown as jest.Mocked<JetStreamClient>;
    alertsMock = {
      countAlerts: jest.fn(),
    } as unknown as jest.Mocked<AlertsPersistenceService>;
    commandsMock = {
      countCommands: jest.fn(),
    } as unknown as jest.Mocked<CommandPersistenceService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostsPersistenceService,
        { provide: JetStreamClient, useValue: natsMock },
        { provide: AlertsPersistenceService, useValue: alertsMock },
        { provide: CommandPersistenceService, useValue: commandsMock },
      ],
    }).compile();

    service = module.get<CostsPersistenceService>(CostsPersistenceService);
  });

  it('calculates costs correctly from external services', async () => {
    const GB = 1024 * 1024 * 1024;
    natsMock.request.mockResolvedValue(
      Buffer.from(JSON.stringify({ dataSizeAtRest: GB * 2 })),
    );
    alertsMock.countAlerts.mockResolvedValue(1024);
    commandsMock.countCommands.mockResolvedValue(1024);

    const result = await service.getTenantCost('tenant-1');

    expect(result.storageGb).toBe(2);
    expect(result.bandwidthGb).toBe(0.002);
  });

  it('handles invalid NATS response with fallback to 0', async () => {
    natsMock.request.mockResolvedValue(Buffer.from('invalid-json'));
    alertsMock.countAlerts.mockResolvedValue(0);
    commandsMock.countCommands.mockResolvedValue(0);

    const result = await service.getTenantCost('tenant-1');

    expect(result.storageGb).toBe(0);
    expect(result.bandwidthGb).toBe(0);
  });
});
