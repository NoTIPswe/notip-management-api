import { Controller } from '@nestjs/common';
import { TenantScoped } from 'src/common/decorators/access-policy.decorator';

@TenantScoped()
@Controller('keys')
export class KeysController {}
