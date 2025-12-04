/**
 * Payment Method
 */
export enum PaymentMethod {
  CARD = 'CARD',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

/**
 * Payment Status
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

/**
 * Payment interface
 */
export interface IPayment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, any>;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Refund interface
 */
export interface IRefund {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  gatewayRefundId?: string;
  processedAt?: Date;
  createdAt: Date;
}

export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Wallet interface
 */
export interface IWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Wallet Transaction
 */
export interface IWalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: Date;
}

export enum WalletTransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  REFUND = 'REFUND',
}

/**
 * Payout interface
 */
export interface IPayout {
  id: string;
  sellerId: string;
  shopId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  bankAccount?: IBankAccount;
  scheduledDate: Date;
  processedDate?: Date;
  failureReason?: string;
  createdAt: Date;
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IBankAccount {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchCode?: string;
  swiftCode?: string;
}

/**
 * Escrow interface (for custom orders)
 */
export interface IEscrow {
  id: string;
  orderId: string;
  amount: number;
  status: EscrowStatus;
  releasedAt?: Date;
  createdAt: Date;
}

export enum EscrowStatus {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
}

/**
 * Split Payment
 */
export interface ISplitPayment {
  paymentId: string;
  platformAmount: number;
  platformCommission: number;
  vendorPayouts: IVendorPayout[];
}

export interface IVendorPayout {
  shopId: string;
  sellerId: string;
  amount: number;
  commission: number;
  netAmount: number;
}
