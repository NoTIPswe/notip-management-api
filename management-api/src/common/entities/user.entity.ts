import { UserRole } from 'src/users/user.enum';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TenantEntity } from 'src/admin/tenants/tenants.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'keycloak_id' })
  keycloakId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TENANT_USER })
  role: UserRole;

  @Column({ type: 'jsonb', nullable: true })
  permissions: any | null;

  @Column({ name: 'last_access', nullable: true })
  lastAccess: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;
}
