import { IsNull } from 'typeorm';
import { ThresholdsPersistenceService } from './thresholds.persistence.service';

const createRepo = () => ({
  find: jest.fn(),
  delete: jest.fn(),
  upsert: jest.fn(),
  findOneOrFail: jest.fn(),
});

describe('ThresholdsPersistenceService', () => {
  it('returns thresholds filtered by tenant', async () => {
    const repo = createRepo();
    repo.find.mockResolvedValue([{ id: 'threshold-1' }]);
    const service = new ThresholdsPersistenceService(repo as never);

    await expect(
      service.getThresholds({ tenantId: 'tenant-1' }),
    ).resolves.toEqual([{ id: 'threshold-1' }]);
    expect(repo.find).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      order: { updatedAt: 'DESC' },
    });
  });

  it('upserts default thresholds and returns the persisted entity', async () => {
    const repo = createRepo();
    const persisted = { id: 'threshold-1' };
    repo.upsert.mockResolvedValue(undefined);
    repo.findOneOrFail.mockResolvedValue(persisted);
    const service = new ThresholdsPersistenceService(repo as never);

    await expect(
      service.setThresholdDefaultType({
        tenantId: 'tenant-1',
        sensorType: 'temperature',
        minValue: 0,
        maxValue: 1,
      }),
    ).resolves.toEqual(persisted);

    expect(repo.upsert).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        sensorType: 'temperature',
        sensorId: null,
        minValue: 0,
        maxValue: 1,
      },
      {
        conflictPaths: ['tenantId', 'sensorType'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    expect(repo.findOneOrFail).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        sensorType: 'temperature',
        sensorId: IsNull(),
      },
    });
  });

  it('upserts sensor-specific thresholds and returns the persisted entity', async () => {
    const repo = createRepo();
    const persisted = { id: 'sensor-threshold' };
    repo.upsert.mockResolvedValue(undefined);
    repo.findOneOrFail.mockResolvedValue(persisted);
    const service = new ThresholdsPersistenceService(repo as never);

    await expect(
      service.setThresholdSensor({
        tenantId: 'tenant-1',
        sensorId: 'sensor-1',
        minValue: 0,
        maxValue: 5,
        sensorType: 'temperature',
      }),
    ).resolves.toEqual(persisted);

    expect(repo.upsert).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        sensorId: 'sensor-1',
        sensorType: 'temperature',
        minValue: 0,
        maxValue: 5,
      },
      {
        conflictPaths: ['tenantId', 'sensorId'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    expect(repo.findOneOrFail).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', sensorId: 'sensor-1' },
    });
  });

  it('does not overwrite sensor type when not provided', async () => {
    const repo = createRepo();
    repo.upsert.mockResolvedValue(undefined);
    repo.findOneOrFail.mockResolvedValue({ id: 'sensor-threshold' });
    const service = new ThresholdsPersistenceService(repo as never);

    await service.setThresholdSensor({
      tenantId: 'tenant-1',
      sensorId: 'sensor-1',
      minValue: 0,
      maxValue: 5,
    });

    expect(repo.upsert).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        sensorId: 'sensor-1',
        minValue: 0,
        maxValue: 5,
      },
      {
        conflictPaths: ['tenantId', 'sensorId'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
  });

  it('deletes sensor thresholds and returns status', async () => {
    const repo = createRepo();
    repo.delete.mockResolvedValue({ affected: 1 });
    const service = new ThresholdsPersistenceService(repo as never);

    await expect(
      service.deleteSensorThreshold({
        tenantId: 'tenant-1',
        sensorId: 'sensor-1',
      }),
    ).resolves.toBe(true);
    expect(repo.delete).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      sensorId: 'sensor-1',
    });
  });

  it('deletes default thresholds by type using null sensor id', async () => {
    const repo = createRepo();
    repo.delete.mockResolvedValue({ affected: 0 });
    const service = new ThresholdsPersistenceService(repo as never);

    await expect(
      service.deleteThresholdType({
        tenantId: 'tenant-1',
        sensorType: 'temperature',
      }),
    ).resolves.toBe(false);
    expect(repo.delete).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      sensorType: 'temperature',
      sensorId: IsNull(),
    });
  });
});
