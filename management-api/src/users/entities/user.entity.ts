import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersRole } from '../enums/users.enum';
import { TenantsEntity } from 'src/common/entities/tenants.entity';

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

  @Column({ type: 'enum', enum: UsersRole, default: UsersRole.TENANT_USER })
  role: UsersRole;

  @Column({ type: 'jsonb', nullable: true })
  permissions: any | null;

  @Column({ name: 'last_access', nullable: true })
  lastAccess: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => TenantsEntity, (tenant) => tenant.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantsEntity;
}
