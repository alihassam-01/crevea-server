import { IEvent } from '@crevea/shared';
import { createLogger } from '@crevea/shared';
import * as emailService from '../services/email.service';

const logger = createLogger('email-handler');

export const handleEmailEvents = async (event: IEvent): Promise<void> => {
  try {
    logger.info(`Handling email event: ${event.type}`);

    const payload = event.payload as any;

    // Route to appropriate email template based on notification type
    switch (payload.type) {
      case 'EMAIL_VERIFICATION':
        // Already handled in auth service
        break;

      case 'PASSWORD_RESET':
        // Already handled in auth service
        break;

      case 'ORDER_CONFIRMATION':
        await emailService.sendOrderConfirmation(
          payload.data.email,
          payload.data.orderNumber,
          payload.data.total
        );
        break;

      case 'ORDER_SHIPPED':
        await emailService.sendShippingNotification(
          payload.data.email,
          payload.data.orderNumber,
          payload.data.trackingNumber
        );
        break;

      default:
        // Generic notification email
        await emailService.sendEmail({
          to: payload.data?.email || '',
          subject: payload.title,
          html: `<h2>${payload.title}</h2><p>${payload.message}</p>`,
        });
    }

    logger.info(`Email sent for event: ${event.type}`);
  } catch (error) {
    logger.error('Failed to handle email event:', error);
  }
};
