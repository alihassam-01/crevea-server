import { getPool } from '../config/database';
import { INotification } from '@crevea/shared';
import { publishEvent } from '../config/kafka';
import { EventType, IEvent } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';

interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export const create = async (data: CreateNotificationData): Promise<INotification> => {
  const pool = getPool();

  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.userId, data.type, data.title, data.message, JSON.stringify(data.data || {})]
  );

  const notification = mapNotification(result.rows[0]);

  // Publish email event if needed
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.EMAIL_SEND,
    timestamp: new Date(),
    payload: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      channels: ['EMAIL'],
      data: data.data,
    },
  };
  await publishEvent(event);

  return notification;
};

export const findByUserId = async (userId: string, options: { page: number; limit: number; unreadOnly?: boolean }) => {
  const pool = getPool();
  const { page, limit, unreadOnly } = options;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM notifications WHERE user_id = $1';
  const values: any[] = [userId];
  let paramIndex = 2;

  if (unreadOnly) {
    query += ` AND read = false`;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);

  let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
  const countValues = [userId];
  if (unreadOnly) {
    countQuery += ' AND read = false';
  }

  const countResult = await pool.query(countQuery, countValues);
  const total = parseInt(countResult.rows[0].count);

  return {
    notifications: result.rows.map(mapNotification),
    total,
  };
};

export const markAsRead = async (id: string, userId: string): Promise<void> => {
  const pool = getPool();
  await pool.query(
    'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  const pool = getPool();
  await pool.query(
    'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
    [userId]
  );
};

const mapNotification = (row: any): INotification => {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: row.data,
    read: row.read,
    createdAt: row.created_at,
  };
};
