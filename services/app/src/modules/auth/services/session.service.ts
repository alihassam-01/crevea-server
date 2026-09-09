import { getSessionRepository, Session, greaterThan, lessThan } from '../../../database';
import { ISession } from '@crevea/shared';

export const createSession = async (data: {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}): Promise<ISession> => {
  const sessionRepo = getSessionRepository();

  const session = sessionRepo.create(data);
  await sessionRepo.save(session);

  return mapSessionToInterface(session);
};

export const findByRefreshToken = async (refreshToken: string): Promise<ISession | null> => {
  const sessionRepo = getSessionRepository();

  const session = await sessionRepo.findOne({
    where: {
      refreshToken,
      expiresAt: greaterThan(new Date()),
    },
  });

  return session ? mapSessionToInterface(session) : null;
};

export const deleteSession = async (refreshToken: string): Promise<void> => {
  const sessionRepo = getSessionRepository();
  await sessionRepo.delete({ refreshToken });
};

export const deleteUserSessions = async (userId: string): Promise<void> => {
  const sessionRepo = getSessionRepository();
  await sessionRepo.delete({ userId });
};

export const deleteAllUserSessions = async (userId: string): Promise<void> => {
  await deleteUserSessions(userId);
};

export const cleanExpiredSessions = async (): Promise<void> => {
  const sessionRepo = getSessionRepository();
  await sessionRepo.delete({
    expiresAt: lessThan(new Date()),
  });
};

const mapSessionToInterface = (session: Session): ISession => {
  return {
    id: session.id,
    userId: session.userId,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
  };
};
