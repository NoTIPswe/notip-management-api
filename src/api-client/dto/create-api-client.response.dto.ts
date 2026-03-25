import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateApiClientResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'name' })
  name: string;
  @ApiProperty({ name: 'client_id' })
  @Expose({ name: 'client_id' })
  clientId: string;
  @ApiProperty({ name: 'client_secret', required: false })
  @Expose({ name: 'client_secret' })
  clientSecret?: string;
  @ApiProperty({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;
}
