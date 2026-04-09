import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  it('returns metrics with the registry content type', async () => {
    const getMetrics = jest.fn().mockResolvedValue('metric 1');
    const metricsService = {
      contentType: 'text/plain; version=0.0.4; charset=utf-8',
      getMetrics,
    } as unknown as MetricsService;
    const controller = new MetricsController(metricsService);
    const setHeader = jest.fn();
    const send = jest.fn();
    const res = {
      setHeader,
      send,
    } as unknown as import('express').Response;

    await controller.metrics(res);

    expect(setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/plain; version=0.0.4; charset=utf-8',
    );
    expect(send).toHaveBeenCalledWith('metric 1');
  });
});
