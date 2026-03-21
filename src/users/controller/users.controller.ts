import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { TenantId } from '../../common/decorators/tenants.decorator';
import { TenantScoped } from '../../common/decorators/access-policy.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersRole } from '../enums/users.enum';
import { UsersMapper } from '../users.mapper';
import { UserResponseDto } from '../dto/user.response.dto';
import { CreateUserRequestDto } from '../dto/create-user.request.dto';
import { CreateUserResponseDto } from '../dto/create-user.response.dto';
import { UpdateUserRequestDto } from '../dto/update-user.request.dto';
import { UpdateUserResponseDto } from '../dto/update-user.response.dto';
import { DeleteUserRequestDto } from '../dto/delete-user.request.dto';
import { DeleteUserResponseDto } from '../dto/delete-user.response.dto';

@TenantScoped()
@Controller('users')
export class UsersController {
  constructor(private readonly s: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get users for tenant' })
  @ApiResponse({ status: 200, type: UserResponseDto, isArray: true })
  @Roles(UsersRole.TENANT_ADMIN)
  async getUsers(@TenantId() tenantId: string): Promise<UserResponseDto[]> {
    const models = await this.s.getUsers({ tenantId });
    return models.map((model) => UsersMapper.toUserResponseDto(model));
  }

  @Post()
  @ApiOperation({ summary: 'Create user in tenant' })
  @ApiResponse({ status: 201, type: CreateUserResponseDto })
  @Roles(UsersRole.TENANT_ADMIN)
  async createUser(
    @TenantId() tenantId: string,
    @Body() dto: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
    const model = await this.s.createUser({
      tenantId,
      email: dto.email,
      name: dto.name,
      role: dto.role,
      password: dto.password,
    });
    return UsersMapper.toCreateUserResponseDto(model);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user in tenant' })
  @ApiResponse({ status: 200, type: UpdateUserResponseDto })
  @Roles(UsersRole.TENANT_ADMIN)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserRequestDto,
  ): Promise<UpdateUserResponseDto> {
    const model = await this.s.updateUser({
      id,
      email: dto.email,
      name: dto.name,
      role: dto.role,
      permissions: dto.permissions,
    });
    return UsersMapper.toUpdateUserResponseDto(model);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Delete users by ids' })
  @ApiResponse({ status: 200, type: DeleteUserResponseDto })
  @Roles(UsersRole.TENANT_ADMIN)
  async deleteUsers(
    @Body() dto: DeleteUserRequestDto,
  ): Promise<DeleteUserResponseDto> {
    const deleted = await this.s.deleteUsers({ ids: dto.ids });
    return {
      deleted,
      failed: [],
    };
  }
}
