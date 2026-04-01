import { Test, TestingModule } from '@nestjs/testing';
import { GatewaysController } from './gateways.controller';
import { GatewaysService } from '../services/gateways.service';
import { GatewayResponseDto } from '../dto/gateway.response.dto';
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
      const result: GatewayResponseDto[] = [{ id: '1', tenantId: 'tenant1' }];
      jest
        .spyOn(service, 'getGateways')
        .mockResolvedValue(result as GatewayModel[]);

      expect(await controller.getAdminGateways('tenant1')).toBe(result);
    });
  });

  describe('addGateway', () => {
    it('should add a gateway', async () => {
      const dto: AddGatewayRequestDto = {
        factoryId: 'f1',
        tenantId: 't1',
        factoryKeyHash: 'h1',
        firmwareVersion: '1.0.0',
        model: 'Model X',
      };
      const result: AddGatewayResponseDto = { id: '1' };
      jest
        .spyOn(service, 'addGateway')
        .mockResolvedValue(result as GatewayModel);

      expect(await controller.addGateway(dto)).toEqual(result);
    });
  });
});
