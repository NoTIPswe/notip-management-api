import { KeysResponseDto } from './dto/keys.response.dto';
import { KeyEntity } from './entities/key.entity';
import { KeyModel } from './models/key.model';

export class KeyMapper {
  static toKeyModels(keys: KeyEntity[]): KeyModel[] {
    return keys.map((k) => ({
      id: k.id,
      gatewayId: k.gatewayId,
      keyMaterial: k.keyMaterial,
      keyVersion: k.keyVersion,
      createdAt: k.createdAt,
      revokedAt: k.revokedAt ?? null,
    }));
  }
  static toDto(model: KeyModel): KeysResponseDto {
    return {
      gatewayId: model.gatewayId,
      keyMaterial: model.keyMaterial,
      keyVersion: model.keyVersion,
    };
  }
}
