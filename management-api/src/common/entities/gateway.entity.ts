import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GatewayMetadataEntity } from './gateway-metadata.entity';
import { TenantsEntity } from 'src/common/entities/tenants.entity';

@Entity('gateways')
export class GatewaysEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'factory_id', unique: true })
  factoryId: string;

  @Column({
    name: 'factory_key_hash',
    select: false,
    nullable: true,
    comment: 'bcrypt hash, invalidated after provisioning',
  })
  factoryKeyHash: string | null;

  @Column({ default: false })
  provisioned: boolean;

  @Column()
  model: string;

  @Column({ name: 'firmware_version' })
  firmwareVersion: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => TenantsEntity, (tenant) => tenant.gateways, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantsEntity;

  @OneToOne(() => GatewayMetadataEntity, (metadata) => metadata.gateway, {
    eager: false,
    onDelete: 'CASCADE',
    nullable: true,
  })
  metadata: GatewayMetadataEntity | null;
}
