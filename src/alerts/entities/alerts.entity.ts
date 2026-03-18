import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { AlertsDetails } from '../interfaces/alerts.interfaces';
import { AlertType } from '../enums/alerts.enum';

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
