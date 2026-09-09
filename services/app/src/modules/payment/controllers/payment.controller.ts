import { successResponse, NotFoundError, AuthorizationError } from '@crevea/shared';
import * as paymentService from '../services/payment.service';
import { PaymentMethod } from '@crevea/shared';
import * as orderService from '../../order/services/order.service';

export const processPayment = async (paymentId: string, method: PaymentMethod, userId: string) => {
  const payment = await paymentService.findById(paymentId);
  
  if (!payment) {
    throw new NotFoundError('Payment', paymentId);
  }
  if (payment.customerId !== userId) {
    throw new AuthorizationError('You can only process your own payments');
  }

  const processed = await paymentService.processPayment(paymentId, method);
  return successResponse(processed);
};

export const getPayment = async (id: string, userId: string) => {
  const payment = await paymentService.findById(id);
  
  if (!payment) {
    throw new NotFoundError('Payment', id);
  }

  // Verify ownership
  if (payment.customerId !== userId) {
    throw new AuthorizationError('You can only view your own payments');
  }

  return successResponse(payment);
};

export const getPaymentByOrder = async (orderId: string, userId: string) => {
  const order = await orderService.findById(orderId);
  if (!order) throw new NotFoundError('Order', orderId);
  if (order.customerId !== userId) {
    throw new AuthorizationError('You can only view payments for your own orders');
  }
  const payment = await paymentService.findByOrderId(orderId);
  
  if (!payment) {
    throw new NotFoundError('Payment for order', orderId);
  }

  return successResponse(payment);
};

export const handlePayFastNotification = async (data: any) => {
  // Verify PayFast notification
  // Update payment status
  // This is a simplified version
  console.log('PayFast notification received:', data);
};
