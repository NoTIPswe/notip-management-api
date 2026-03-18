// common/entities/gateway.entity.ts
import { TenantsEntity } from './tenants.entity';
import { GatewayMetadataEntity } from './gateways-metadata.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('gateways')
export class GatewaysEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => TenantsEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantsEntity;

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

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => GatewayMetadataEntity, (meta) => meta.gateway, {
    cascade: true,
  })
  metadata: GatewayMetadataEntity;
}
