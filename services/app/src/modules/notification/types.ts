import { JsonValue } from '@crevea/shared';

export interface NotificationEventPayload {
  userId?: string;
  customerId?: string;
  sellerId?: string;
  vendorIds?: string[];
  orderId?: string;
  amount?: number;
  [key: string]: JsonValue | undefined;
}
