import { Injectable } from '@nestjs/common';
import { UsersPersistenceService } from './users.persistence.service';

@Injectable()
export class UsersService {
  constructor(private readonly ps: UsersPersistenceService) {}

  async getUsers(tenantId: string): Promise<UserModel[]> {
    const entities = await this.ps.getUsers(tenantId);
    return entities.map(UsersMapper.toModel);
  }
}
