import { IsNull } from 'typeorm';
import { ThresholdsPersistenceService } from './thresholds.persistence.service';

const createRepo = () => ({
  find: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
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
    const existing = null;
    const created = { id: 'threshold-1' };
    repo.findOne.mockResolvedValueOnce(existing);
    repo.create.mockReturnValueOnce(created);
    repo.save.mockResolvedValueOnce(created);
    const service = new ThresholdsPersistenceService(repo as never);

    await expect(
      service.setThresholdDefaultType({
        tenantId: 'tenant-1',
        sensorType: 'temperature',
        minValue: 0,
        maxValue: 1,
      }),
    ).resolves.toEqual(created);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        sensorType: 'temperature',
        sensorId: IsNull(),
      },
    });
    expect(repo.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      sensorType: 'temperature',
      sensorId: null,
      minValue: 0,
      maxValue: 1,
    });
    expect(repo.save).toHaveBeenCalledWith(created);
  });

  it('upserts sensor-specific thresholds and returns the persisted entity', async () => {
    const repo = createRepo();
    const existing = null;
    const created = { id: 'sensor-threshold' };
    repo.findOne.mockResolvedValueOnce(existing);
    repo.create.mockReturnValueOnce(created);
    repo.save.mockResolvedValueOnce(created);
    const service = new ThresholdsPersistenceService(repo as never);

    await expect(
      service.setThresholdSensor({
        tenantId: 'tenant-1',
        sensorId: 'sensor-1',
        minValue: 0,
        maxValue: 5,
        sensorType: 'temperature',
      }),
    ).resolves.toEqual(created);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', sensorId: 'sensor-1' },
    });
    expect(repo.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      sensorId: 'sensor-1',
      minValue: 0,
      maxValue: 5,
      sensorType: 'temperature',
    });
    expect(repo.save).toHaveBeenCalledWith(created);
  });

  it('does not overwrite sensor type when not provided', async () => {
    const repo = createRepo();
    const existing = {
      id: 'sensor-threshold',
      sensorType: 'humidity',
      minValue: 1,
      maxValue: 2,
    };
    repo.findOne.mockResolvedValueOnce(existing);
    repo.save.mockResolvedValueOnce({ ...existing, minValue: 0, maxValue: 5 });
    const service = new ThresholdsPersistenceService(repo as never);

    await service.setThresholdSensor({
      tenantId: 'tenant-1',
      sensorId: 'sensor-1',
      minValue: 0,
      maxValue: 5,
    });

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', sensorId: 'sensor-1' },
    });
    expect(repo.save).toHaveBeenCalledWith({
      ...existing,
      minValue: 0,
      maxValue: 5,
    });
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
