import { getPool } from '../config/database';
import { publishEvent } from '../config/kafka';
import { IPayment, PaymentMethod, PaymentStatus } from '@crevea/shared';
import { EventType, IEvent, IPaymentCompletedPayload } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface CreatePaymentData {
  orderId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  metadata?: any;
}

export const create = async (data: CreatePaymentData): Promise<IPayment> => {
  const pool = getPool();

  const result = await pool.query(
    `INSERT INTO payments (order_id, customer_id, amount, method, status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.orderId, data.customerId, data.amount, data.method, PaymentStatus.PENDING, JSON.stringify(data.metadata || {})]
  );

  return mapPayment(result.rows[0]);
};

export const processPayment = async (paymentId: string, method: PaymentMethod): Promise<IPayment> => {
  const pool = getPool();

  // Get payment
  const paymentResult = await pool.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
  const payment = paymentResult.rows[0];

  if (!payment) {
    throw new Error('Payment not found');
  }

  let status = PaymentStatus.COMPLETED;
  let gatewayTransactionId = null;
  let gatewayResponse = null;

  // Process based on method
  switch (method) {
    case PaymentMethod.CARD:
      // Integrate with PayFast
      const payfastResult = await processPayFast(payment);
      gatewayTransactionId = payfastResult.transactionId;
      gatewayResponse = payfastResult.response;
      status = payfastResult.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
      break;

    case PaymentMethod.CASH_ON_DELIVERY:
      // COD is marked as pending until delivery
      status = PaymentStatus.PENDING;
      break;

    case PaymentMethod.WALLET:
      // Deduct from wallet
      // This would call wallet service
      status = PaymentStatus.COMPLETED;
      break;

    case PaymentMethod.BANK_TRANSFER:
      // Bank transfer requires manual verification
      status = PaymentStatus.PENDING;
      break;
  }

  // Update payment
  const updateResult = await pool.query(
    `UPDATE payments SET 
      status = $1,
      gateway_transaction_id = $2,
      gateway_response = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 RETURNING *`,
    [status, gatewayTransactionId, JSON.stringify(gatewayResponse), paymentId]
  );

  const updatedPayment = mapPayment(updateResult.rows[0]);

  // Publish event if completed
  if (status === PaymentStatus.COMPLETED) {
    const event: IEvent<IPaymentCompletedPayload> = {
      id: uuidv4(),
      type: EventType.PAYMENT_COMPLETED,
      timestamp: new Date(),
      payload: {
        paymentId: updatedPayment.id,
        orderId: updatedPayment.orderId,
        amount: updatedPayment.amount,
      },
    };
    await publishEvent(event);
  } else if (status === PaymentStatus.FAILED) {
    const event: IEvent = {
      id: uuidv4(),
      type: EventType.PAYMENT_FAILED,
      timestamp: new Date(),
      payload: { paymentId: updatedPayment.id, orderId: updatedPayment.orderId },
    };
    await publishEvent(event);
  }

  return updatedPayment;
};

export const findById = async (id: string): Promise<IPayment | null> => {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapPayment(result.rows[0]) : null;
};

export const findByOrderId = async (orderId: string): Promise<IPayment | null> => {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
  return result.rows.length > 0 ? mapPayment(result.rows[0]) : null;
};

// PayFast integration (simplified)
const processPayFast = async (payment: any): Promise<{ success: boolean; transactionId: string; response: any }> => {
  // This is a simplified version
  // In production, you would:
  // 1. Generate PayFast payment data
  // 2. Create signature
  // 3. Redirect user to PayFast
  // 4. Handle ITN (Instant Transaction Notification) callback
  // 5. Verify payment

  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase = process.env.PAYFAST_PASSPHRASE;

  // Generate payment data
  const paymentData = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    amount: payment.amount.toFixed(2),
    item_name: `Order ${payment.order_id}`,
    return_url: `${process.env.FRONTEND_URL}/payment/success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    notify_url: `${process.env.API_URL}/payments/payfast/notify`,
  };

  // Generate signature
  const signature = generatePayFastSignature(paymentData, passphrase);

  // In production, return URL for redirect
  // For now, simulate success
  return {
    success: true,
    transactionId: `PF-${Date.now()}`,
    response: { ...paymentData, signature },
  };
};

const generatePayFastSignature = (data: any, passphrase: string): string => {
  const pfParamString = Object.keys(data)
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');

  return crypto
    .createHash('md5')
    .update(pfParamString + (passphrase ? `&passphrase=${passphrase}` : ''))
    .digest('hex');
};

const mapPayment = (row: any): IPayment => {
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    amount: parseFloat(row.amount),
    currency: row.currency,
    method: row.method,
    status: row.status,
    gatewayTransactionId: row.gateway_transaction_id,
    gatewayResponse: row.gateway_response,
    failureReason: row.failure_reason,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};
