import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ApiClientResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'name' })
  name: string;
  @ApiProperty({ name: 'client_id' })
  @Expose({ name: 'client_id' })
  clientId: string;
  @ApiProperty({ name: 'created_at', type: String, format: 'date-time' })
  @Expose({ name: 'created_at' })
  createdAt: string;
}
