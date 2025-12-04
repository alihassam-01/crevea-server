import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ProductStatus, ProductType } from '../types/product.types';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  shopId!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  @Index()
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 500, nullable: true })
  shortDescription?: string;

  @Column({
    type: 'varchar',
    enum: ProductType,
    default: ProductType.PHYSICAL,
  })
  type!: ProductType;

  @Column({
    type: 'varchar',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @Index()
  status!: ProductStatus;

  @Column({ length: 50 })
  @Index()
  category!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags!: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  images!: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice?: number;

  @Column({ length: 3, default: 'ZAR' })
  currency!: string;

  @Column({ length: 100, nullable: true })
  sku?: string;

  @Column({ type: 'int', nullable: true })
  weight?: number;

  @Column({ type: 'jsonb', nullable: true })
  dimensions?: Record<string, any>;

  @Column({ type: 'jsonb' })
  attributes!: Record<string, any>;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ default: 0 })
  totalReviews!: number;

  @Column({ default: 0 })
  totalSales!: number;

  @Column({ default: false })
  isFeatured!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
