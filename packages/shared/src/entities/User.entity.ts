import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UserRole, UserStatus } from '../types/user.types';

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
