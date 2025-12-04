import nodemailer from 'nodemailer';
import { createLogger } from '@crevea/shared';

const logger = createLogger('email-service');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (data: SendEmailData): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@crevea.com',
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });

    logger.info(`Email sent to: ${data.to}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Welcome to Crevea!',
    html: `
      <h1>Welcome to Crevea, ${name}!</h1>
      <p>Thank you for joining our marketplace for handmade goods.</p>
      <p>Start exploring unique items from talented artisans!</p>
    `,
  });
};

export const sendOrderConfirmation = async (email: string, orderNumber: string, total: number): Promise<void> => {
  await sendEmail({
    to: email,
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <h1>Order Confirmed!</h1>
      <p>Your order <strong>${orderNumber}</strong> has been confirmed.</p>
      <p>Total: R${total.toFixed(2)}</p>
      <p>We'll notify you when your order ships.</p>
    `,
  });
};

export const sendShippingNotification = async (email: string, orderNumber: string, trackingNumber: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: `Your Order Has Shipped - ${orderNumber}`,
    html: `
      <h1>Your Order Has Shipped!</h1>
      <p>Order: <strong>${orderNumber}</strong></p>
      <p>Tracking Number: <strong>${trackingNumber}</strong></p>
      <p>Your order is on its way!</p>
    `,
  });
};
