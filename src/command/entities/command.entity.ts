import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GatewayEntity } from '../../gateways/entities/gateway.entity';
import { TenantEntity } from '../../common/entities/tenant.entity';
import { CommandType } from '../enums/command-type.enum';
import { CommandStatus } from '../enums/command-status.enum';

@Entity('commands')
export class CommandEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'gateway_id', type: 'uuid' })
  gatewayId: string;

  @ManyToOne(() => GatewayEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gateway_id' })
  gateway: GatewayEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'text' })
  type: CommandType;

  @Column({ type: 'text' })
  status: CommandStatus;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt: Date;

  @Column({ name: 'ack_received_at', type: 'timestamptz', nullable: true })
  ackReceivedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
