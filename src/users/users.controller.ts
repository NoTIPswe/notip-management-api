import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { TenantId } from 'src/common/decorators/tenants.decorator';
import { TenantScoped } from 'src/common/decorators/access-policy.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UsersRole } from './enums/users.enum';

@TenantScoped()
@Controller('users')
export class UsersController {
  constructor(private readonly s: UsersService) {}

  @Roles(UsersRole.TENANT_ADMIN)
  async getUsers(@TenantId() tenantId: string) {
    return this.s.getUsers({ tenantId });
  }
}
