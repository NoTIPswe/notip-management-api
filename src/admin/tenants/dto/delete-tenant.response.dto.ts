import { ApiProperty } from '@nestjs/swagger';

export class DeleteTenantResponseDto {
  @ApiProperty({ name: 'message' })
  message: string;
}
