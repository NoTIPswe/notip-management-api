import { UserEntity } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TenantStatus } from '../enum/tenants.enum';
import { GatewaysEntity } from 'src/gateways/entities/gateway.entity';

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

  @OneToMany(() => UserEntity, (user) => user.tenant)
  users: UserEntity[];
  @OneToMany(() => GatewaysEntity, (gateways) => gateways.tenantsEntity)
  gateways: GatewaysEntity[];
}
