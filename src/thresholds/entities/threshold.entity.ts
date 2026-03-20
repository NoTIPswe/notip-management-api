import { TenantEntity } from '../../common/entities/tenant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('thresholds')
@Index('IDX_THRESHOLD_TENANT_SENSOR_ID_NULL', ['tenantId', 'sensorType'], {
  unique: true,
  where: 'sensor_id IS NULL',
})
@Index('IDX_THRESHOLD_TENANT_SENSOR_ID_NOT_NULL', ['tenantId', 'sensorId'], {
  unique: true,
  where: 'sensor_id IS NOT NULL',
})
export class ThresholdEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'sensor_type', nullable: true })
  sensorType: string | null;

  @Column({ name: 'sensor_id', type: 'uuid', nullable: true })
  sensorId: string | null;

  @Column({ name: 'min_value', type: 'float' })
  minValue: number;

  @Column({ name: 'max_value', type: 'float' })
  maxValue: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
