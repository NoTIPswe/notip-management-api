import { TenantEntity } from 'src/common/entities/tenant.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('thresholds')
@Index('IDX_THRESHOLD_TENANT_SENSOR_ID_NULL', ['tenant_id', 'sensor_type'], {
  unique: true,
  where: 'sensor_id IS NULL',
})
@Index('IDX_THRESHOLD_TENANT_SENSOR_ID_NOT_NULL', ['tenant_id', 'sensor_id'], {
  unique: true,
  where: 'sensor_id IS NOT NULL',
})
export class Threshold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'sensor_type' })
  sensorType: string;

  @Column({ name: 'sensor_id', type: 'uuid' })
  sensorId: string;

  @Column({ name: 'min_value', type: 'float' })
  minValue: number;

  @Column({ name: 'max_value', type: 'float' })
  maxValue: number;
}
