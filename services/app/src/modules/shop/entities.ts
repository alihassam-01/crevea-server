import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ShopCategory, ShopStatus, VerificationStatus } from '@crevea/shared';

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  slug!: string;

  @Column({ type: 'varchar' })
  @Index()
  sellerId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  logo?: string;

  @Column({ type: 'varchar', nullable: true })
  banner?: string;

  @Column({
    type: 'varchar',
    enum: ShopCategory,
  })
  @Index()
  category!: ShopCategory;

  @Column({
    type: 'varchar',
    enum: ShopStatus,
    default: ShopStatus.ACTIVE,
  })
  @Index()
  status!: ShopStatus;

  @Column({
    type: 'varchar',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  @Index()
  verificationStatus!: VerificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  address?: any;

  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks?: any;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  commissionRate!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ type: 'int', default: 0 })
  totalReviews!: number;

  @Column({ type: 'int', default: 0 })
  totalSales!: number;

  @Column({ type: 'jsonb', nullable: true })
  verificationDocuments?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('size_charts')
export class SizeChart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  shopId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  imageUrl!: string;

  @Column({ type: 'varchar', nullable: true })
  category?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('seller_earnings')
export class SellerEarnings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  shopId!: string;

  @Column({ type: 'varchar' })
  @Index()
  orderId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  grossAmount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  commissionRate!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commissionAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netAmount!: number;

  @Column({ type: 'varchar', default: 'COMPLETED' })
  @Index()
  status!: string; // PENDING | COMPLETED | REFUNDED

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  shopId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  requestedAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  approvedAmount?: number;

  @Column({ type: 'varchar', default: 'PENDING' })
  @Index()
  status!: string; // PENDING | APPROVED | PROCESSING | COMPLETED | REJECTED

  @Column({ type: 'varchar' })
  paymentMethod!: string;

  @Column({ type: 'jsonb' })
  paymentDetails!: any;

  @CreateDateColumn()
  requestedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  approvedBy?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @UpdateDateColumn()
  updatedAt!: Date;
}


