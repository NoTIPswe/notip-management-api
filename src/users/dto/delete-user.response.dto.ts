import { ApiProperty } from '@nestjs/swagger';

export class DeleteUserResponseDto {
  @ApiProperty({ name: 'deleted' })
  deleted: number;
  @ApiProperty({ name: 'failed', type: [String] })
  failed: string[];
}
