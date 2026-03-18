// common/entities/gateway-metadata.entity.ts
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { GatewayStatus } from '../enums/gateway.enum';
import { GatewayEntity } from './gateway.entity';

@Entity('gateways_metadata')
export class GatewayMetadataEntity {
  @PrimaryColumn('uuid', { name: 'gateway_id' })
  gatewayId: string;

  @Column({ unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: GatewayStatus,
    default: GatewayStatus.GATEWAY_OFFLINE,
  })
  status: GatewayStatus;

  @Column({ name: 'last_seen_at', type: 'timestamp', nullable: true })
  lastSeenAt: Date | null;

  @Column({ name: 'send_frequency_ms', type: 'bigint' })
  sendFrequencyMs: number;

  @OneToOne(() => GatewayEntity, (gateway) => gateway.metadata, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gateway_id' })
  gateway: GatewayEntity;
}
