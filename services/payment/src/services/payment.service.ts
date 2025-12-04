import { getPaymentRepository, Payment } from '../config/database';
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
  const paymentRepo = getPaymentRepository();

  const payment = paymentRepo.create({
    orderId: data.orderId,
    customerId: data.customerId,
    amount: data.amount,
    currency: 'ZAR',
    method: data.method,
    status: PaymentStatus.PENDING,
    metadata: data.metadata || {},
  });

  await paymentRepo.save(payment);

  return mapPaymentToInterface(payment);
};

export const processPayment = async (paymentId: string, method: PaymentMethod): Promise<IPayment> => {
  const paymentRepo = getPaymentRepository();

  // Get payment
  const payment = await paymentRepo.findOne({ where: { id: paymentId } });

  if (!payment) {
    throw new Error('Payment not found');
  }

  let status = PaymentStatus.COMPLETED;
  let gatewayTransactionId = null;
  let gatewayResponse: any = null;

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
      status = PaymentStatus.COMPLETED;
      break;

    case PaymentMethod.BANK_TRANSFER:
      // Bank transfer requires manual verification
      status = PaymentStatus.PENDING;
      break;
  }

  // Update payment
  await paymentRepo.update(paymentId, {
    status,
    gatewayTransactionId,
    gatewayResponse,
  });

  const updatedPayment = await paymentRepo.findOne({ where: { id: paymentId } });
  if (!updatedPayment) throw new Error('Payment not found after update');

  // Publish event if completed
  if (status === PaymentStatus.COMPLETED) {
    const event: IEvent<IPaymentCompletedPayload> = {
      id: uuidv4(),
      type: EventType.PAYMENT_COMPLETED,
      timestamp: new Date(),
      payload: {
        paymentId: updatedPayment.id,
        orderId: updatedPayment.orderId,
        amount: parseFloat(updatedPayment.amount.toString()),
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

  return mapPaymentToInterface(updatedPayment);
};

export const findById = async (id: string): Promise<IPayment | null> => {
  const paymentRepo = getPaymentRepository();
  const payment = await paymentRepo.findOne({ where: { id } });
  return payment ? mapPaymentToInterface(payment) : null;
};

export const findByOrderId = async (orderId: string): Promise<IPayment | null> => {
  const paymentRepo = getPaymentRepository();
  const payment = await paymentRepo.findOne({ where: { orderId } });
  return payment ? mapPaymentToInterface(payment) : null;
};

// PayFast integration (simplified)
const processPayFast = async (payment: Payment): Promise<{ success: boolean; transactionId: string; response: any }> => {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase = process.env.PAYFAST_PASSPHRASE;

  // Generate payment data
  const paymentData = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    amount: payment.amount.toString(),
    item_name: `Order ${payment.orderId}`,
    return_url: `${process.env.FRONTEND_URL}/payment/success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    notify_url: `${process.env.API_URL}/payments/payfast/notify`,
  };

  // Generate signature
  const signature = generatePayFastSignature(paymentData, passphrase || '');

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

const mapPaymentToInterface = (payment: Payment): IPayment => {
  return {
    id: payment.id,
    orderId: payment.orderId,
    customerId: payment.customerId,
    amount: parseFloat(payment.amount.toString()),
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    gatewayTransactionId: payment.gatewayTransactionId,
    gatewayResponse: payment.gatewayResponse,
    failureReason: payment.failureReason,
    metadata: payment.metadata,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};
