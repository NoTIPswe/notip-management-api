import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { In, Repository } from 'typeorm';
import {
  CreateUserPersistenceInput,
  UpdateUserPersistenceInput,
} from './interfaces/service-persistence.interfaces';

@Injectable()
export class UsersPersistenceService {
  constructor(private readonly r: Repository<UserEntity>) {}

  async getUsers(tenantId: string): Promise<UserEntity[]> {
    return this.r.find({ where: { tenantId } });
  }

  async createUsers(input: CreateUserPersistenceInput): Promise<UserEntity> {
    const user = this.r.create({ ...input, tenantId: input.tenantId });
    return this.r.save(user);
  }

  async updateUser(
    input: UpdateUserPersistenceInput,
  ): Promise<UserEntity | null> {
    const user = await this.r.findOne({ where: { id: input.id } });
    if (!user) {
      return null;
    }
    Object.assign(user, input);
    return this.r.save(user);
  }

  async deleteUsers(ids: string[]): Promise<number> {
    const result = await this.r.delete({ id: In(ids) });
    return result.affected ?? 0;
  }
}
