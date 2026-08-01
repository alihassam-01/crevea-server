// Import entities from shared package
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UserRole, UserStatus, OAuthProvider } from '@crevea/shared';

// Define entities locally since they need TypeORM decorators
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  email!: string;

  @Column({ type: 'varchar' })
  passwordHash!: string;

  @Column({ type: 'varchar' })
  firstName!: string;

  @Column({ type: 'varchar' })
  lastName!: string;

  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
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

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  mfaEnabled!: boolean;

  @Column({ type: 'varchar', nullable: true })
  mfaSecret?: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;
}

@Entity('oauth_accounts')
export class OAuthAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  userId!: string;

  @Column({
    type: 'varchar',
    enum: OAuthProvider,
  })
  provider!: OAuthProvider;

  @Column({ type: 'varchar' })
  @Index()
  providerId!: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'jsonb', nullable: true })
  profile?: any;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  refreshToken!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'varchar', nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  token!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  token!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}


