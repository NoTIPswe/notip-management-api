import { GatewayEntity } from '../../common/entities/gateway.entity';
import { TenantEntity } from '../../common/entities/tenant.entity';

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('alert_configs')
@Index('IDX_alert_config_tenant_default', ['tenantId'], {
  unique: true,
  where: '"gateway_id" IS NULL',
})
@Index('IDX_alert_config_gateway_override', ['gatewayId'], {
  unique: true,
  where: '"gateway_id" IS NOT NULL',
})
export class AlertsConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'gateway_id', nullable: true })
  gatewayId: string | null;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @ManyToOne(() => GatewayEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'gateway_id' })
  gateway: GatewayEntity | null;

  @Column({ name: 'gateway_unreachable_timeout_ms', default: 60000 })
  gatewayTimeoutMs: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
