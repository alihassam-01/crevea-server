import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { OAuthProvider } from '../types/user.types';

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
