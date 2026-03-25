import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TenantStatus } from '../enums/tenants.enum';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ schema: 'admin', name: 'tenants' })
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: 'active' })
  status: TenantStatus;

  @Column({ name: 'suspension_interval_days', type: 'int', nullable: true })
  suspensionIntervalDays: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserEntity, (user) => user.tenant)
  users: UserEntity[];

  @OneToMany('GatewayEntity', 'tenant')
  gateways: any[];
}
