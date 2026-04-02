import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import {
  TenantId,
  CurrentUserId,
  CurrentUserRole,
} from '../../common/decorators/tenants.decorator';
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
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Users')
@TenantScoped()
@Controller('users')
export class UsersController {
  constructor(private readonly s: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by id' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @Roles(UsersRole.TENANT_ADMIN)
  async getUserById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<UserResponseDto> {
    const users = await this.s.getUsers({ tenantId });
    const user = users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UsersMapper.toUserResponseDto(user);
  }

  @Get()
  @ApiOperation({ summary: 'Get users for tenant' })
  @ApiResponse({ status: 200, type: UserResponseDto, isArray: true })
  @Roles(UsersRole.TENANT_ADMIN)
  async getUsers(@TenantId() tenantId: string): Promise<UserResponseDto[]> {
    const models = await this.s.getUsers({ tenantId });
    return models.map((model) => UsersMapper.toUserResponseDto(model));
  }

  @Post()
  @Audit({ action: 'CREATE_USER', resource: 'Users' })
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
  @Audit({ action: 'UPDATE_USER', resource: 'Users' })
  @ApiOperation({ summary: 'Update user in tenant' })
  @ApiResponse({ status: 200, type: UpdateUserResponseDto })
  @Roles(UsersRole.TENANT_ADMIN)
  async updateUser(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserRequestDto,
  ): Promise<UpdateUserResponseDto> {
    const model = await this.s.updateUser({
      id,
      tenantId,
      email: dto.email,
      name: dto.name,
      role: dto.role,
      permissions: dto.permissions,
    });
    return UsersMapper.toUpdateUserResponseDto(model);
  }

  @Post('bulk-delete')
  @Audit({ action: 'DELETE_USERS', resource: 'Users' })
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete users by ids' })
  @ApiResponse({ status: 200, type: DeleteUserResponseDto })
  @Roles(UsersRole.TENANT_ADMIN)
  async deleteUsers(
    @TenantId() tenantId: string,
    @CurrentUserId() requesterId: string,
    @CurrentUserRole() requesterRole: UsersRole,
    @Body() dto: DeleteUserRequestDto,
  ): Promise<DeleteUserResponseDto> {
    const deleted = await this.s.deleteUsers({
      tenantId,
      ids: dto.ids,
      requesterId,
      requesterRole,
    });
    return {
      deleted,
      failed: [],
    };
  }
}
