import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantEntity } from '../../common/entities/tenant.entity';
import { ThresholdEntity } from '../entities/threshold.entity';
import { ThresholdsPersistenceService } from './thresholds.persistence.service';
import { ThresholdsService } from './thresholds.service';

const createThresholdEntity = (
  overrides: Partial<ThresholdEntity> = {},
): ThresholdEntity => ({
  id: 'threshold-1',
  tenantId: 'tenant-1',
  tenant: overrides.tenant ?? ({ id: 'tenant-1' } as unknown as TenantEntity),
  sensorType: 'temperature',
  sensorId: null,
  minValue: -10,
  maxValue: 40,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
  ...overrides,
});

const createPersistenceMock = () => ({
  getThresholds: jest.fn(),
  setThresholdDefaultType: jest.fn(),
  setThresholdSensor: jest.fn(),
  deleteSensorThreshold: jest.fn(),
  deleteThresholdType: jest.fn(),
});

describe('ThresholdsService', () => {
  it('returns mapped thresholds', async () => {
    const persistence = createPersistenceMock();
    persistence.getThresholds.mockResolvedValue([createThresholdEntity()]);
    const service = new ThresholdsService(
      persistence as unknown as ThresholdsPersistenceService,
    );

    await expect(
      service.getThresholds({ tenantId: 'tenant-1' }),
    ).resolves.toEqual([
      expect.objectContaining({ sensorType: 'temperature', sensorId: null }),
    ]);

    expect(persistence.getThresholds).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
    });
  });

  it('sets default thresholds and validates sensor type', async () => {
    const persistence = createPersistenceMock();
    persistence.setThresholdDefaultType.mockResolvedValue(
      createThresholdEntity(),
    );
    const service = new ThresholdsService(
      persistence as unknown as ThresholdsPersistenceService,
    );

    await service.setThresholdDefaultType({
      tenantId: 'tenant-1',
      sensorType: ' temperature ',
      minValue: -5,
      maxValue: 5,
    });

    expect(persistence.setThresholdDefaultType).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      sensorType: 'temperature',
      minValue: -5,
      maxValue: 5,
    });
  });

  it('throws when sensor type is missing', async () => {
    const persistence = createPersistenceMock();
    const service = new ThresholdsService(
      persistence as unknown as ThresholdsPersistenceService,
    );

    await expect(
      service.setThresholdDefaultType({
        tenantId: 'tenant-1',
        sensorType: '  ',
        minValue: 0,
        maxValue: 100,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('sets sensor thresholds and trims identifiers', async () => {
    const persistence = createPersistenceMock();
    persistence.setThresholdSensor.mockResolvedValue(
      createThresholdEntity({ sensorId: 'sensor-1' }),
    );
    const service = new ThresholdsService(
      persistence as unknown as ThresholdsPersistenceService,
    );

    await service.setThresholdSensor({
      tenantId: 'tenant-1',
      sensorId: ' sensor-1 ',
      minValue: 0,
      maxValue: 1,
    });

    expect(persistence.setThresholdSensor).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      sensorId: 'sensor-1',
      minValue: 0,
      maxValue: 1,
      sensorType: undefined,
    });
  });

  it('validates numeric ranges', async () => {
    const persistence = createPersistenceMock();
    const service = new ThresholdsService(
      persistence as unknown as ThresholdsPersistenceService,
    );

    await expect(
      service.setThresholdSensor({
        tenantId: 'tenant-1',
        sensorId: 'sensor-1',
        minValue: 10,
        maxValue: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when deleting thresholds that do not exist', async () => {
    const persistence = createPersistenceMock();
    persistence.deleteSensorThreshold.mockResolvedValue(false);
    persistence.deleteThresholdType.mockResolvedValue(false);
    const service = new ThresholdsService(
      persistence as unknown as ThresholdsPersistenceService,
    );

    await expect(
      service.deleteSensorThreshold({
        tenantId: 'tenant-1',
        sensorId: 'sensor-1',
      }),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.deleteThresholdType({
        tenantId: 'tenant-1',
        sensorType: 'temperature',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
