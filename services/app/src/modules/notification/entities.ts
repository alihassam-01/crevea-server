import { NotificationType } from '@crevea/shared';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// Notification entity
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: any;

  @Column({ type: 'boolean', default: false })
  @Index()
  read!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

