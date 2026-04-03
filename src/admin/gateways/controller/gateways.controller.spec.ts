import { Test, TestingModule } from '@nestjs/testing';
import { GatewaysController } from './gateways.controller';
import { GatewaysService } from '../services/gateways.service';
import { AddGatewayResponseDto } from '../dto/add-gateway.response.dto';
import { AddGatewayRequestDto } from '../dto/add-gateway.request.dto';
import { GatewayModel } from '../models/gateway.model';

describe('GatewaysController', () => {
  let controller: GatewaysController;
  let service: GatewaysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewaysController],
      providers: [
        {
          provide: GatewaysService,
          useValue: {
            getGateways: jest.fn(),
            addGateway: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GatewaysController>(GatewaysController);
    service = module.get<GatewaysService>(GatewaysService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAdminGateways', () => {
    it('should return an array of gateways', async () => {
      const gatewayModel: GatewayModel = {
        id: '1',
        tenantId: 'tenant1',
        factoryId: 'factory-1',
        factoryKeyHash: null,
        model: 'model-1',
        firmwareVersion: '1.0.0',
        provisioned: false,
        createdAt: new Date('2026-04-03T00:00:00.000Z'),
      };

      jest.spyOn(service, 'getGateways').mockResolvedValue([gatewayModel]);

      await expect(controller.getAdminGateways('tenant1')).resolves.toEqual([
        {
          id: '1',
          tenantId: 'tenant1',
          factoryId: 'factory-1',
          model: 'model-1',
          firmwareVersion: '1.0.0',
          provisioned: false,
          createdAt: '2026-04-03T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('addGateway', () => {
    it('should add a gateway', async () => {
      const dto: AddGatewayRequestDto = {
        factoryId: 'f1',
        tenantId: 't1',
        factoryKey: 'k1',
        model: 'M1',
      };

      const gatewayModel: GatewayModel = {
        id: '1',
        tenantId: 't1',
        factoryId: 'f1',
        factoryKeyHash: 'hash',
        model: 'M1',
        firmwareVersion: '1.0.0',
        provisioned: false,
        createdAt: new Date('2026-04-03T00:00:00.000Z'),
      };

      const result: AddGatewayResponseDto = { id: '1' };
      jest.spyOn(service, 'addGateway').mockResolvedValue(gatewayModel);

      expect(await controller.addGateway(dto)).toEqual(result);
    });
  });
});
