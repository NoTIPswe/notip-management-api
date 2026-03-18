import { Controller } from '@nestjs/common';
import { TenantScoped } from 'src/common/decorators/access-policy.decorator';

@TenantScoped()
@Controller('thresholds')
export class ThresholdsController {}
