import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../services/app/src/generated/prisma/client';
import { hashPassword, sanitizeEmail } from '@crevea/shared';

// Same normalization the app applies on register/login (e.g. Gmail dots are dropped), or the account could never log in
const email = sanitizeEmail(process.env.ADMIN_EMAIL?.trim() ?? '');
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
}

if (password.length < 8) {
  throw new Error('ADMIN_PASSWORD must be at least 8 characters long');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const seedAdmin = async (): Promise<void> => {
  try {
    const passwordHash = await hashPassword(password);
    const admin = await prisma.users.upsert({
      where: { email },
      update: {
        passwordHash,
        firstName: 'Crevea',
        lastName: 'Admin',
        role: 'EXECUTIVE',
        status: 'ACTIVE',
        emailVerified: true,
      },
      create: {
        email,
        passwordHash,
        firstName: 'Crevea',
        lastName: 'Admin',
        role: 'EXECUTIVE',
        status: 'ACTIVE',
        emailVerified: true,
        mfaEnabled: false,
      },
      select: { id: true, email: true, role: true, status: true },
    });

    console.log(`Executive account ready: ${admin.email} (${admin.role})`);
  } finally {
    await prisma.$disconnect();
  }
};

seedAdmin().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
