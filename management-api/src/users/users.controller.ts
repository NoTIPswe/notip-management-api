import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { TenantId } from 'src/common/decorators/tenants.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly s: UsersService) {}

  async getUsers(@TenantId() tenantId: string) {
    return this.s.getUsers(tenantId);
  }
}
