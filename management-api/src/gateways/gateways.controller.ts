import { Controller } from '@nestjs/common';
import { TenantScoped } from 'src/common/decorators/access-policy.decorator';

@TenantScoped()
@Controller('gateways')
export class GatewaysController {}
