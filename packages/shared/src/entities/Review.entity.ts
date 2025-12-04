import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ReviewType, ReviewStatus } from '../types/review.types';
import { sanitizeHtml, sanitizeText } from '../utils/sanitization';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    enum: ReviewType,
  })
  type!: ReviewType;

  @Column()
  @Index()
  targetId!: string;

  @Column()
  @Index()
  customerId!: string;

  @Column({ nullable: true })
  orderId?: string;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ length: 255, nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'text', array: true, default: '{}' })
  images!: string[];

  @Column({
    type: 'varchar',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  @Index()
  status!: ReviewStatus;

  @Column({ default: 0 })
  helpfulCount!: number;

  @Column({ default: false })
  verifiedPurchase!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  sellerResponse?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Sanitize review content before saving to database
   * This prevents XSS attacks from malicious review content
   */
  @BeforeInsert()
  @BeforeUpdate()
  sanitizeContent() {
    // Sanitize title - strip all HTML
    if (this.title) {
      this.title = sanitizeText(this.title);
    }

    // Sanitize comment - allow limited HTML tags
    if (this.comment) {
      this.comment = sanitizeHtml(this.comment);
    }

    // Ensure rating is within bounds
    if (this.rating < 1) this.rating = 1;
    if (this.rating > 5) this.rating = 5;
  }
}
