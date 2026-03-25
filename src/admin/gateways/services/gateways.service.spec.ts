import { Test, TestingModule } from '@nestjs/testing';
import { GatewaysService } from './gateways.service';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { GatewayModel } from '../models/gateway.model';
import { GatewayEntity } from '../../../gateways/entities/gateway.entity';
import { TenantEntity } from '../../../common/entities/tenant.entity';

describe('GatewaysService', () => {
  let service: GatewaysService;
  let persistenceService: GatewaysPersistenceService;

  const mockGatewaysPersistenceService = {
    getGateways: jest.fn(),
    addGateway: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewaysService,
        {
          provide: GatewaysPersistenceService,
          useValue: mockGatewaysPersistenceService,
        },
      ],
    }).compile();

    service = module.get<GatewaysService>(GatewaysService);
    persistenceService = module.get<GatewaysPersistenceService>(
      GatewaysPersistenceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGateways', () => {
    it('should return an array of GatewayModel', async () => {
      const mockEntity: Partial<GatewayEntity> = {
        id: '1',
        factoryId: 'factory-1',
        tenant: { id: 'tenant-1' } as TenantEntity,
        provisioned: true,
        createdAt: new Date(),
        firmwareVersion: '1.0.0',
        model: 'model-1',
      };
      mockGatewaysPersistenceService.getGateways.mockResolvedValue([
        mockEntity,
      ]);

      const result = await service.getGateways({ tenantId: 'tenant-1' });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(GatewayModel);
      expect(result[0].id).toBe('1');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(persistenceService.getGateways).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
      });
    });
  });

  describe('addGateway', () => {
    it('should add and return a GatewayModel', async () => {
      const mockEntity: Partial<GatewayEntity> = {
        id: '2',
        factoryId: 'factory-2',
        tenant: { id: 'tenant-2' } as TenantEntity,
        provisioned: false,
        createdAt: new Date(),
        firmwareVersion: '0.0.0',
        model: 'unknown-model',
      };
      mockGatewaysPersistenceService.addGateway.mockResolvedValue(mockEntity);

      const result = await service.addGateway({
        factoryId: 'factory-2',
        tenantId: 'tenant-2',
        factoryKeyHash: 'hash-2',
      });

      expect(result).toBeInstanceOf(GatewayModel);
      expect(result.id).toBe('2');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(persistenceService.addGateway).toHaveBeenCalledWith({
        factoryId: 'factory-2',
        tenantId: 'tenant-2',
        factoryKeyHash: 'hash-2',
      });
    });
  });
});
