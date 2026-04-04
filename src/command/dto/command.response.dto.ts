import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CommandStatus } from '../enums/command-status.enum';

export class CommandResponseDto {
  @ApiProperty({ name: 'command_id' })
  @Expose({ name: 'command_id' })
  commandId: string;

  @ApiProperty({ type: String, enum: CommandStatus })
  status: CommandStatus;

  @ApiProperty({ name: 'issued_at', type: String, format: 'date-time' })
  @Expose({ name: 'issued_at' })
  issuedAt: string;
}
