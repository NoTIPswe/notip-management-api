import { ThresholdsController } from './thresholds.controller';
import { ThresholdsService } from '../services/thresholds.service';

const createThresholdModel = (overrides: Record<string, unknown> = {}) => ({
  id: 'threshold-1',
  tenantId: 'tenant-1',
  sensorType: 'temperature',
  sensorId: null,
  minValue: -10,
  maxValue: 40,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
  ...overrides,
});

describe('ThresholdsController', () => {
  it('returns mapped thresholds list', async () => {
    const service = {
      getThresholds: jest
        .fn()
        .mockResolvedValue([createThresholdModel({ sensorId: 'sensor-1' })]),
    } as unknown as ThresholdsService;
    const controller = new ThresholdsController(service);

    await expect(controller.getThresholds('tenant-1')).resolves.toEqual([
      expect.objectContaining({
        sensorType: 'temperature',
        sensorId: 'sensor-1',
        minValue: -10,
        maxValue: 40,
      }),
    ]);
  });

  it('maps response for default threshold updates', async () => {
    const model = createThresholdModel();
    const service = {
      setThresholdDefaultType: jest.fn().mockResolvedValue(model),
    } as unknown as ThresholdsService;
    const controller = new ThresholdsController(service);

    await expect(
      controller.setDefaultThreshold('tenant-1', {
        sensorType: 'temperature',
        minValue: -10,
        maxValue: 40,
      }),
    ).resolves.toEqual({
      sensorType: 'temperature',
      minValue: -10,
      maxValue: 40,
      updatedAt: model.updatedAt.toISOString(),
    });
  });

  it('maps response for sensor-specific threshold updates', async () => {
    const model = createThresholdModel({ sensorId: 'sensor-1' });
    const service = {
      setThresholdSensor: jest.fn().mockResolvedValue(model),
    } as unknown as ThresholdsService;
    const controller = new ThresholdsController(service);

    await expect(
      controller.setSensorThreshold('tenant-1', 'sensor-1', {
        minValue: 0,
        maxValue: 10,
      }),
    ).resolves.toEqual({
      sensorId: 'sensor-1',
      sensorType: 'temperature',
      minValue: -10,
      maxValue: 40,
      updatedAt: model.updatedAt.toISOString(),
    });
  });

  it('returns acknowledgements when deleting thresholds', async () => {
    const service = {
      deleteSensorThreshold: jest.fn().mockResolvedValue(undefined),
      deleteThresholdType: jest.fn().mockResolvedValue(undefined),
    } as unknown as ThresholdsService;
    const controller = new ThresholdsController(service);

    await expect(
      controller.deleteSensorThreshold('tenant-1', 'sensor-1'),
    ).resolves.toEqual({
      message: 'deleted',
    });
    await expect(
      controller.deleteThresholdType('tenant-1', 'temperature'),
    ).resolves.toEqual({
      message: 'deleted',
    });
  });
});
