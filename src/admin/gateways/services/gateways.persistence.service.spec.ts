import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { GatewayEntity } from '../../../gateways/entities/gateway.entity';

describe('GatewaysPersistenceService', () => {
  let service: GatewaysPersistenceService;
  let repository: Repository<GatewayEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewaysPersistenceService,
        {
          provide: getRepositoryToken(GatewayEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<GatewaysPersistenceService>(
      GatewaysPersistenceService,
    );
    repository = module.get<Repository<GatewayEntity>>(
      getRepositoryToken(GatewayEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGateways', () => {
    it('should return an array of gateways', async () => {
      const gateways: GatewayEntity[] = [new GatewayEntity()];
      jest.spyOn(repository, 'find').mockResolvedValue(gateways);

      expect(await service.getGateways({})).toEqual(gateways);
    });
  });

  describe('addGateway', () => {
    it('should add a gateway', async () => {
      const input = {
        factoryId: 'f1',
        tenantId: 't1',
        factoryKeyHash: 'h1',
      };
      const entity = new GatewayEntity();
      jest.spyOn(repository, 'create').mockReturnValue(entity);
      jest.spyOn(repository, 'save').mockResolvedValue(entity);

      expect(await service.addGateway(input)).toEqual(entity);
    });
  });
});
