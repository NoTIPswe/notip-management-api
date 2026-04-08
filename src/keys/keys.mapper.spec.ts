import { instanceToPlain } from 'class-transformer';
import { KeyMapper } from './keys.mapper';
import { KeyModel } from './models/key.model';

describe('KeyMapper', () => {
  it('maps key model to a snake_case DTO with base64 key material', () => {
    const model: KeyModel = {
      id: 'key-1',
      gatewayId: 'gateway-1',
      keyMaterial: Buffer.from([1, 2, 3]),
      keyVersion: 2,
      createdAt: new Date('2026-04-05T12:00:00.000Z'),
      revokedAt: null,
    };

    const dto = KeyMapper.toDto(model);

    expect(instanceToPlain(dto)).toEqual({
      gateway_id: 'gateway-1',
      key_material: 'AQID',
      key_version: 2,
    });
  });
});
