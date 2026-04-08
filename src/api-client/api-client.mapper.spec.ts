import { instanceToPlain } from 'class-transformer';
import { ApiClientMapper } from './api-client.mapper';

describe('ApiClientMapper', () => {
  const model = {
    id: 'client-1',
    tenantId: 'tenant-1',
    name: 'Primary Client',
    keycloakClientId: 'kc-client-1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  it('serializes list DTO using snake_case keys for exposed fields', () => {
    const dto = ApiClientMapper.toApiClientsResponseDto(model);

    expect(instanceToPlain(dto)).toEqual({
      id: 'client-1',
      name: 'Primary Client',
      client_id: 'kc-client-1',
      created_at: '2024-01-01T00:00:00.000Z',
    });
  });

  it('serializes create DTO using snake_case keys for exposed fields', () => {
    const dto = ApiClientMapper.toCreateApiClientResponseDto(
      model,
      'client-secret',
    );

    expect(instanceToPlain(dto)).toEqual({
      id: 'client-1',
      name: 'Primary Client',
      client_id: 'kc-client-1',
      client_secret: 'client-secret',
      created_at: '2024-01-01T00:00:00.000Z',
    });
  });
});
