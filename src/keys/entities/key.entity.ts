import { GatewayEntity } from '../../gateways/entities/gateway.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { keyMaterialTransformer } from '../encryption/key-material-encryption';

@Entity('keys')
export class KeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GatewayEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gateway_id' })
  gateway: GatewayEntity;

  @Column({ name: 'gateway_id', type: 'uuid' })
  gatewayId: string;

  @Column({
    name: 'key_material',
    type: 'bytea',
    transformer: keyMaterialTransformer,
  })
  keyMaterial: Buffer;

  @Column({ name: 'key_version', type: 'int' })
  keyVersion: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
}
