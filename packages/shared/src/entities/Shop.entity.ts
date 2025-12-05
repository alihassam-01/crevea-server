import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ShopCategory, ShopStatus, VerificationStatus } from '../types/shop.types';

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
  address?: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks?: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  commissionRate!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ type: 'int', default: 0 })
  totalReviews!: number;

  @Column({ type: 'int', default: 0 })
  totalSales!: number;

  @Column({ type: 'jsonb', nullable: true })
  verificationDocuments?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
