import { GatewaysEntity } from 'src/admin/entities/gateways.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('keys')
export class KeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GatewaysEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gateway_id' })
  gateway: GatewaysEntity;

  @Column({ name: 'gateway_id', type: 'uuid', nullable: true })
  gatewayId: string | null;

  @Column({ name: 'key_material', type: 'bytea' })
  keyMaterial: Buffer;

  @Column({ name: 'key_version', type: 'int' })
  keyVersion: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'revoked_at', nullable: true })
  revokedAt: Date | null;
}
