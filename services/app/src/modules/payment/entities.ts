import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { PaymentMethod, PaymentStatus } from '@crevea/shared';

// Payment entities
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  orderId!: string;

  @Column({ type: 'varchar' })
  @Index()
  customerId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'ZAR' })
  currency!: string;

  @Column({
    type: 'varchar',
    enum: PaymentMethod,
  })
  method!: PaymentMethod;

  @Column({
    type: 'varchar',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status!: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  gatewayTransactionId?: string;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse?: any;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

