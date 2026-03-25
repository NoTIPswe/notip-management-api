import { TenantEntity } from '../../common/entities/tenant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('api_clients')
export class ApiClientEntity {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => TenantEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index({ unique: true })
  @Column()
  name: string;

  @Index({ unique: true })
  @Column({ name: 'keycloak_client_id' })
  keycloakClientId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
