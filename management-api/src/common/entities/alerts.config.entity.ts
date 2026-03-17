import { TenantsEntity } from 'src/common/entities/tenants.entity';
import { GatewaysEntity } from 'src/gateways/entities/gateway.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
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

  @ManyToOne(() => TenantsEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantsEntity;

  @ManyToOne(() => GatewaysEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'gateway_id' })
  gateway: GatewaysEntity | null;

  @Column({ name: 'gateway_unreachable_timeout_ms', default: 60000 })
  gatewayUnreachableTimeoutMs: number;
}
