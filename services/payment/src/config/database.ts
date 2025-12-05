import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createLogger } from '@crevea/shared';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { PaymentMethod, PaymentStatus } from '@crevea/shared';

const logger = createLogger('database');

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
  gatewayResponse?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.PAYMENT_DATABASE_URL || process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Payment],
  subscribers: [],
  migrations: [],
  maxQueryExecutionTime: 1000,
  poolSize: 20,
});

export const initDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected with TypeORM');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
};

export const getPaymentRepository = () => AppDataSource.getRepository(Payment);
