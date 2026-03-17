import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlertType } from '../alerts.enum';
import type { AlertsDetails } from '../interfaces/alerts.interfaces';

@Entity('alerts')
export class AlertsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'enum', enum: AlertType, default: AlertType.GATEWAY_OFFLINE })
  type: AlertType;

  @Column({ name: 'gateway_id', type: 'uuid' })
  gatewayId: string;

  @Column({ type: 'jsonb' })
  details: AlertsDetails;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
