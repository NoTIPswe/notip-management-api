import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GatewaysEntity } from 'src/gateways/entities/gateway.entity';
import { GatewayStatus } from '../gateway.enum';
@Entity('gateways_metadata')
export class GatewayMetadataEntity {
  @PrimaryColumn('uuid', { name: 'gateway_id' })
  gatewayId: string;

  @Column({ unique: true })
  name: string;

  @Column({ enum: GatewayStatus })
  status: GatewayStatus;

  @UpdateDateColumn({ name: 'last_seen_at', nullable: true })
  lastSeenAt: Date;

  @Column({ name: 'send_frequency_ms', type: 'bigint' })
  sendFrequencyMs: number;

  @ManyToOne(() => GatewaysEntity, (gateway) => gateway.metadata, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gateway_id' })
  gateway: GatewaysEntity;
}
