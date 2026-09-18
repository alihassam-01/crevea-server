import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../services/app/src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const updateShops = async () => {
  try {
    console.log('Fetching shops...');
    const shops = await prisma.shops.findMany();
    
    for (const shop of shops) {
      if (shop.name.startsWith('Handmade by ')) {
        const newName = shop.name.replace('Handmade by ', '') + ' updated';
        await prisma.shops.update({
          where: { id: shop.id },
          data: { name: newName }
        });
        console.log(`Updated shop: "${shop.name}" -> "${newName}"`);
      }
    }
    console.log('Successfully updated all shops!');
  } catch (error) {
    console.error('Error updating shops:', error);
  } finally {
    await prisma.$disconnect();
  }
};

updateShops();
