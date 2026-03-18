import { UsersEntity } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GatewaysEntity } from './gateways.entity';
import { TenantStatus } from '../enums/tenants.enum';

@Entity('admin/tenants')
export class TenantsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: 'active' })
  status: TenantStatus;

  @Column({ name: 'suspension_interval_days', nullable: true })
  suspensionIntervalDays: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UsersEntity, (user) => user.tenant)
  users: UsersEntity[];
  @OneToMany(() => GatewaysEntity, (gateways) => gateways.tenant)
  gateways: GatewaysEntity[];
}
