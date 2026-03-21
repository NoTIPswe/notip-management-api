import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuditLogResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'user_id' })
  @Expose({ name: 'user_id' })
  userId: string;
  @ApiProperty({ name: 'action' })
  action: string;
  @ApiProperty({ name: 'resource' })
  resource: string;
  @ApiProperty({ name: 'details' })
  details: string;
  @ApiProperty({ name: 'timestamp', type: String, format: 'date-time' })
  timestamp: Date;
}
