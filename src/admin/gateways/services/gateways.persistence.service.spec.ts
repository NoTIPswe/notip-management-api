import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { GatewayEntity } from '../../../gateways/entities/gateway.entity';
import { GatewayMetadataEntity } from '../../../gateways/entities/gateway-metadata.entity';
import { DEFAULT_GATEWAY_SEND_FREQUENCY_MS } from '../../../gateways/gateway.constants';

describe('GatewaysPersistenceService', () => {
  let service: GatewaysPersistenceService;
  let repository: Repository<GatewayEntity>;
  let metadataRepository: Repository<GatewayMetadataEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewaysPersistenceService,
        {
          provide: getRepositoryToken(GatewayEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(GatewayMetadataEntity),
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
    metadataRepository = module.get<Repository<GatewayMetadataEntity>>(
      getRepositoryToken(GatewayMetadataEntity),
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
        model: 'm1',
      };
      const gatewayEntity = {
        id: 'gateway-1',
      } as GatewayEntity;
      const metadataEntity = {
        gatewayId: 'gateway-1',
        sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
      } as GatewayMetadataEntity;

      jest.spyOn(repository, 'create').mockReturnValue(gatewayEntity);
      jest.spyOn(repository, 'save').mockResolvedValue(gatewayEntity);
      const metadataCreateSpy = jest
        .spyOn(metadataRepository, 'create')
        .mockReturnValue(metadataEntity);
      jest.spyOn(metadataRepository, 'save').mockResolvedValue(metadataEntity);

      await expect(service.addGateway(input)).resolves.toEqual({
        ...gatewayEntity,
        metadata: metadataEntity,
      });

      expect(metadataCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          gatewayId: 'gateway-1',
          sendFrequencyMs: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
        }),
      );
    });
  });
});
