import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  it('exposes the registry content type and metrics output', async () => {
    expect(service.contentType).toContain('text/plain');

    const metrics = await service.getMetrics();

    expect(metrics).toContain('notip_mgmt_http_requests_total');
    expect(metrics).toContain('notip_mgmt_http_request_duration_seconds');
    expect(metrics).toContain('notip_mgmt_http_requests_in_flight');
  });

  it('tracks in-flight requests and observed requests', async () => {
    service.incInFlight('GET');
    service.observeHttpRequest('GET', '/gateways', 200, 0.25);
    service.decInFlight('GET');

    const metrics = await service.getMetrics();

    expect(metrics).toContain(
      'notip_mgmt_http_requests_total{method="GET",route="/gateways",status_code="200"} 1',
    );
    expect(metrics).toContain(
      'notip_mgmt_http_requests_in_flight{method="GET"} 0',
    );
  });

  it('resolves route labels for string paths', () => {
    expect(
      service.resolveRouteLabel({
        baseUrl: '/api',
        route: { path: '/users/:id' },
      }),
    ).toBe('/api/users/:id');
  });

  it('resolves route labels for path arrays', () => {
    expect(
      service.resolveRouteLabel({
        baseUrl: '/api',
        route: { path: ['/one', '/two'] },
      }),
    ).toBe('/api/one|/two');
  });

  it('returns _unmatched when route path is missing or invalid', () => {
    expect(service.resolveRouteLabel({})).toBe('_unmatched');
    expect(
      service.resolveRouteLabel({
        baseUrl: '/api',
        route: { path: 123 as never },
      }),
    ).toBe('_unmatched');
  });
});
