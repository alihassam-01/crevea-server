import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../services/app/src/generated/prisma/client';
import { hashPassword } from '@crevea/shared';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const categories = ['Crochet', 'Painting', 'Art', 'Handcraft'];

const seedProducts = async (): Promise<void> => {
  try {
    console.log('Cleaning up existing seeded data...');
    await prisma.products.deleteMany();
    await prisma.shops.deleteMany();
    await prisma.users.deleteMany({ where: { role: 'SELLER' } });
    console.log('Cleanup completed.');

    const passwordHash = await hashPassword('password123');
    
    // Create Sellers
    const sellers = [];
    for (let i = 1; i <= 3; i++) {
      const email = `seller${i}@crevea.local`;
      const seller = await prisma.users.upsert({
        where: { email },
        update: {
          passwordHash,
          firstName: `Seller`,
          lastName: `${i}`,
          role: 'SELLER',
          status: 'ACTIVE',
          emailVerified: true,
        },
        create: {
          email,
          passwordHash,
          firstName: `Seller`,
          lastName: `${i}`,
          role: 'SELLER',
          status: 'ACTIVE',
          emailVerified: true,
          mfaEnabled: false,
        },
        select: { id: true, email: true },
      });
      sellers.push(seller);
      console.log(`Ensured seller: ${seller.email}`);
    }
    
    // Create Shops
    const shops = [];
    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      const slug = `shop-seller-${i+1}`;
      const shop = await prisma.shops.upsert({
        where: { slug },
        update: {
          name: `Seller ${i+1}`,
          category: categories[i % categories.length],
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
        },
        create: {
          slug,
          sellerId: seller.id,
          name: `Seller ${i+1}`,
          category: categories[i % categories.length],
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
        }
      });
      shops.push(shop);
      console.log(`Ensured shop: ${shop.name} (${shop.slug})`);
    }

    // Create Products
    for (let s = 0; s < shops.length; s++) {
      const shop = shops[s];
      for (let p = 1; p <= 5; p++) {
        const slug = `${shop.slug}-product-${p}`;
        const cat = categories[(s + p) % categories.length];
        await prisma.products.upsert({
          where: { slug },
          update: {
            name: `Amazing ${cat} Item ${p}`,
            price: 100.00 + (p * 15.5),
            status: 'ACTIVE',
            category: cat,
            shopId: shop.id,
          },
          create: {
            slug,
            shopId: shop.id,
            name: `Amazing ${cat} Item ${p}`,
            description: `This is an amazing ${cat.toLowerCase()} piece created with love by ${shop.name}. High quality materials used.`,
            shortDescription: `Beautiful handmade ${cat.toLowerCase()} piece`,
            price: 100.00 + (p * 15.5),
            status: 'ACTIVE',
            category: cat,
            tags: ['handmade', cat.toLowerCase()],
            images: ['/assets/filler-image.png'],
            currency: 'ZAR',
            type: 'PHYSICAL',
            weight: 500,
            isFeatured: p === 1, 
          }
        });
      }
      console.log(`Ensured 5 products for shop: ${shop.name}`);
    }
    
    console.log('Seeding products, shops, and sellers completed successfully.');
  } finally {
    await prisma.$disconnect();
  }
};

seedProducts().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
