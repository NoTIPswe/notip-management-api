import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CommandStatus } from '../enums/command-status.enum';

export class CommandStatusResponseDto {
  @ApiProperty({ name: 'command_id' })
  @Expose({ name: 'command_id' })
  commandId: string;

  @ApiProperty({ type: 'string', enum: CommandStatus })
  status: CommandStatus;

  @ApiProperty({ type: 'string', format: 'date-time' })
  timestamp: string;
}
