import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createLogger } from '@crevea/shared';

const logger = createLogger('database');

// Import entities from shared package
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UserRole, UserStatus, OAuthProvider } from '@crevea/shared';

// Define entities locally since they need TypeORM decorators
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({
    type: 'varchar',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  @Index()
  role!: UserRole;

  @Column({
    type: 'varchar',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @Index()
  status!: UserStatus;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ default: false })
  mfaEnabled!: boolean;

  @Column({ nullable: true })
  mfaSecret?: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  lastLoginAt?: Date;
}

@Entity('oauth_accounts')
export class OAuthAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @Column({
    type: 'varchar',
    enum: OAuthProvider,
  })
  provider!: OAuthProvider;

  @Column()
  @Index()
  providerId!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'jsonb', nullable: true })
  profile?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @Column({ unique: true })
  @Index()
  refreshToken!: string;

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @Column({ unique: true })
  @Index()
  token!: string;

  @Column()
  expiresAt!: Date;

  @Column({ default: false })
  used!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @Column({ unique: true })
  @Index()
  token!: string;

  @Column()
  expiresAt!: Date;

  @Column({ default: false })
  used!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, OAuthAccount, Session, PasswordResetToken, EmailVerificationToken],
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

// Export repositories
export const getUserRepository = () => AppDataSource.getRepository(User);
export const getOAuthAccountRepository = () => AppDataSource.getRepository(OAuthAccount);
export const getSessionRepository = () => AppDataSource.getRepository(Session);
export const getPasswordResetTokenRepository = () => AppDataSource.getRepository(PasswordResetToken);
export const getEmailVerificationTokenRepository = () => AppDataSource.getRepository(EmailVerificationToken);
