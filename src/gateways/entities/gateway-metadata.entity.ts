import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { GatewayStatus } from '../enums/gateway.enum';
import { DEFAULT_GATEWAY_SEND_FREQUENCY_MS } from '../gateway.constants';
import { GatewayEntity } from './gateway.entity';

@Entity('gateways_metadata')
export class GatewayMetadataEntity {
  @PrimaryColumn('uuid', { name: 'gateway_id' })
  gatewayId: string;

  @Column({ unique: true, nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: GatewayStatus,
    default: GatewayStatus.GATEWAY_OFFLINE,
  })
  status: GatewayStatus;

  @Column({ name: 'last_seen_at', type: 'timestamp', nullable: true })
  lastSeenAt: Date;

  @Column({
    name: 'send_frequency_ms',
    type: 'bigint',
    nullable: false,
    default: DEFAULT_GATEWAY_SEND_FREQUENCY_MS,
  })
  sendFrequencyMs: number;

  @OneToOne(() => GatewayEntity, (gateway) => gateway.metadata, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gateway_id' })
  gateway: GatewayEntity;
}
