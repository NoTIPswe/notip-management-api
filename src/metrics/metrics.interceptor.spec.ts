import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

describe('MetricsInterceptor', () => {
  it('passes through non-http contexts without recording metrics', async () => {
    const metricsService: Pick<
      MetricsService,
      'incInFlight' | 'decInFlight' | 'observeHttpRequest' | 'resolveRouteLabel'
    > = {
      incInFlight: jest.fn(),
      decInFlight: jest.fn(),
      observeHttpRequest: jest.fn(),
      resolveRouteLabel: jest.fn(),
    };
    const interceptor = new MetricsInterceptor(
      metricsService as MetricsService,
    );
    const next: CallHandler = { handle: () => of('ok') };
    const context = {
      getType: () => 'rpc',
    } as unknown as ExecutionContext;

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('ok');
    expect(metricsService.incInFlight).not.toHaveBeenCalled();
  });

  it('records metrics for http requests', async () => {
    const metricsService: Pick<
      MetricsService,
      'incInFlight' | 'decInFlight' | 'observeHttpRequest' | 'resolveRouteLabel'
    > = {
      incInFlight: jest.fn(),
      decInFlight: jest.fn(),
      observeHttpRequest: jest.fn(),
      resolveRouteLabel: jest.fn().mockReturnValue('/api/users'),
    };
    const interceptor = new MetricsInterceptor(
      metricsService as MetricsService,
    );
    const req = { method: 'POST', baseUrl: '/api', route: { path: '/users' } };
    const res = { statusCode: 201 };
    const next: CallHandler = { handle: () => of('created') };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('created');
    expect(metricsService.incInFlight).toHaveBeenCalledWith('POST');
    expect(metricsService.resolveRouteLabel).toHaveBeenCalledWith(req);
    expect(metricsService.observeHttpRequest).toHaveBeenCalledWith(
      'POST',
      '/api/users',
      201,
      expect.any(Number),
    );
    expect(metricsService.decInFlight).toHaveBeenCalledWith('POST');
  });

  it('uses fallback method and status code when missing', async () => {
    const metricsService: Pick<
      MetricsService,
      'incInFlight' | 'decInFlight' | 'observeHttpRequest' | 'resolveRouteLabel'
    > = {
      incInFlight: jest.fn(),
      decInFlight: jest.fn(),
      observeHttpRequest: jest.fn(),
      resolveRouteLabel: jest.fn().mockReturnValue('_unmatched'),
    };
    const interceptor = new MetricsInterceptor(
      metricsService as MetricsService,
    );
    const next: CallHandler = { handle: () => of('ok') };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;

    await lastValueFrom(interceptor.intercept(context, next));

    expect(metricsService.incInFlight).toHaveBeenCalledWith('UNKNOWN');
    expect(metricsService.observeHttpRequest).toHaveBeenCalledWith(
      'UNKNOWN',
      '_unmatched',
      500,
      expect.any(Number),
    );
    expect(metricsService.decInFlight).toHaveBeenCalledWith('UNKNOWN');
  });
});
