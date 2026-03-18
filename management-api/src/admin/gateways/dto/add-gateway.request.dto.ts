import { IsString } from 'class-validator';

export class AddGatewayRequestDto {
  @IsString()
  factoryId: string;
  @IsString()
  tenantId: string;
  @IsString()
  factoryKeyHash: string;
}
