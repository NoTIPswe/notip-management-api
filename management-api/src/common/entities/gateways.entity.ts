import { TenantsEntity } from 'src/common/entities/tenants.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('admin/gateways')
export class GatewaysEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => TenantsEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenantsEntity: TenantsEntity;

  @Column({ name: 'factory_id', unique: true })
  factoryId: string;

  @Column({ name: 'factory_key_hash', select: false, nullable: true })
  factoryKeyHash: string | null;

  @Column({ default: false })
  provisioned: boolean;

  @Column()
  model: string;

  @Column({ name: 'firmware_version' })
  firmwareVersion: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
