import { Pool } from 'pg';
import { createLogger } from '@crevea/shared';

const logger = createLogger('database');
let pool: Pool;

export const initDatabase = async (): Promise<void> => {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }

  await createTables();
};

export const getPool = (): Pool => {
  if (!pool) throw new Error('Database not initialized');
  return pool;
};

const createTables = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL,
        email_enabled BOOLEAN DEFAULT true,
        sms_enabled BOOLEAN DEFAULT false,
        push_enabled BOOLEAN DEFAULT true,
        in_app_enabled BOOLEAN DEFAULT true,
        preferences JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);');

    await client.query('COMMIT');
    logger.info('Notification tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to create tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) await pool.end();
};
