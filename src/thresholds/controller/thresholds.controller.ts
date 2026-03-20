import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { TenantId } from '../../common/decorators/tenants.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersRole } from '../../users/enums/users.enum';
import { ThresholdsService } from '../services/thresholds.service';
import { ThresholdsMapper } from '../thresholds.mapper';
import { ThresholdResponseDto } from '../dto/threshold.response.dto';
import { SetThresholdDefaultTypeRequestDto } from '../dto/set-threshold-default-type.request.dto';
import { SetThresholdDefaultTypeResponseDto } from '../dto/set-threshold-default-type.response.dto';
import { SetThresholdSensorRequestDto } from '../dto/set-threshold-sensor.request.dto';
import { SetThresholdSensorResponseDto } from '../dto/set-threshold-sensor.response.dto';

@TenantScoped()
@Controller('thresholds')
export class ThresholdsController {
  constructor(private readonly ts: ThresholdsService) {}

  @Get()
  @Roles(UsersRole.TENANT_USER, UsersRole.TENANT_ADMIN)
  async getThresholds(
    @TenantId() tenantId: string,
  ): Promise<ThresholdResponseDto[]> {
    const models = await this.ts.getThresholds({ tenantId });
    return models.map((model) =>
      ThresholdsMapper.toThresholdResponseDto(model),
    );
  }

  @Put('default')
  @Roles(UsersRole.TENANT_ADMIN)
  async setDefaultThreshold(
    @TenantId() tenantId: string,
    @Body() input: SetThresholdDefaultTypeRequestDto,
  ): Promise<SetThresholdDefaultTypeResponseDto> {
    const model = await this.ts.setThresholdDefaultType({
      tenantId,
      sensorType: input.sensorType,
      minValue: input.minValue,
      maxValue: input.maxValue,
    });
    return ThresholdsMapper.toSetThresholdDefaultTypeResponseDto(model);
  }

  @Put('sensor/:sensorId')
  @Roles(UsersRole.TENANT_ADMIN)
  async setSensorThreshold(
    @TenantId() tenantId: string,
    @Param('sensorId') sensorId: string,
    @Body() input: SetThresholdSensorRequestDto,
  ): Promise<SetThresholdSensorResponseDto> {
    const model = await this.ts.setThresholdSensor({
      tenantId,
      sensorId,
      minValue: input.minValue,
      maxValue: input.maxValue,
      sensorType: input.sensorType,
    });
    return ThresholdsMapper.toSetThresholdSensorResponseDto(model);
  }

  @Delete('sensor/:sensorId')
  @Roles(UsersRole.TENANT_ADMIN)
  async deleteSensorThreshold(
    @TenantId() tenantId: string,
    @Param('sensorId') sensorId: string,
  ): Promise<{ message: string }> {
    await this.ts.deleteSensorThreshold({ tenantId, sensorId });
    return { message: 'deleted' };
  }

  @Delete('type/:sensorType')
  @Roles(UsersRole.TENANT_ADMIN)
  async deleteThresholdType(
    @TenantId() tenantId: string,
    @Param('sensorType') sensorType: string,
  ): Promise<{ message: string }> {
    await this.ts.deleteThresholdType({ tenantId, sensorType });
    return { message: 'deleted' };
  }
}
