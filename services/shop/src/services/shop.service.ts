import { getShopRepository, Shop } from '../config/database';
import { ShopCategory, ShopStatus, VerificationStatus, IShop } from '@crevea/shared';
import { publishEvent } from '../config/kafka';
import { EventType, IEvent } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml, sanitizeText } from '@crevea/shared';
import { Like } from 'typeorm';

interface CreateShopData {
  sellerId: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  category: ShopCategory;
  address?: any;
  phone?: string;
  email?: string;
  socialLinks?: any;
}

export const create = async (data: CreateShopData): Promise<IShop> => {
  const shopRepo = getShopRepository();

  // Sanitize inputs
  const sanitizedName = sanitizeText(data.name);
  const sanitizedDescription = data.description ? sanitizeHtml(data.description) : undefined;

  // Check if shop with slug exists
  const existing = await shopRepo.findOne({ where: { slug: data.slug } });
  if (existing) {
    throw new Error('Shop with this slug already exists');
  }

  // Create shop
  const shop = shopRepo.create({
    sellerId: data.sellerId,
    name: sanitizedName,
    slug: data.slug,
    description: sanitizedDescription,
    logo: data.logo,
    banner: data.banner,
    category: data.category,
    status: ShopStatus.ACTIVE,
    verificationStatus: VerificationStatus.PENDING,
    address: data.address,
    phone: data.phone,
    email: data.email,
    socialLinks: data.socialLinks,
    commissionRate: 10,
    rating: 0,
    totalReviews: 0,
    totalSales: 0,
  });

  await shopRepo.save(shop);

  // Publish event
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.SHOP_CREATED,
    timestamp: new Date(),
    payload: {
      shopId: shop.id,
      sellerId: data.sellerId,
      name: sanitizedName,
    },
  };
  await publishEvent(event);

  return mapShopToInterface(shop);
};

export const findById = async (id: string): Promise<IShop | null> => {
  const shopRepo = getShopRepository();
  const shop = await shopRepo.findOne({ where: { id } });
  return shop ? mapShopToInterface(shop) : null;
};

export const findBySlug = async (slug: string): Promise<IShop | null> => {
  const shopRepo = getShopRepository();
  const shop = await shopRepo.findOne({ where: { slug } });
  return shop ? mapShopToInterface(shop) : null;
};

export const findBySeller = async (sellerId: string): Promise<IShop[]> => {
  const shopRepo = getShopRepository();
  const shops = await shopRepo.find({ where: { sellerId } });
  return shops.map(mapShopToInterface);
};

export const search = async (
  query: string,
  options: { page: number; limit: number; category?: ShopCategory; status?: ShopStatus; search?: string }
): Promise<{ shops: IShop[]; total: number }> => {
  const shopRepo = getShopRepository();
  const { page, limit, category, status } = options;
  const skip = (page - 1) * limit;

  const where: any = {
    status: status || ShopStatus.ACTIVE,
    verificationStatus: VerificationStatus.APPROVED,
  };

  if (category) {
    where.category = category;
  }

  if (query) {
    where.name = Like(`%${query}%`);
  }

  const [shops, total] = await shopRepo.findAndCount({
    where,
    order: { createdAt: 'DESC' },
    take: limit,
    skip,
  });

  return {
    shops: shops.map(mapShopToInterface),
    total,
  };
};

export const updateShop = async (id: string, data: Partial<Shop>): Promise<IShop> => {
  const shopRepo = getShopRepository();

  // Sanitize if updating text fields
  const updateData: any = { ...data };
  if (updateData.name) updateData.name = sanitizeText(updateData.name);
  if (updateData.description) updateData.description = sanitizeHtml(updateData.description);

  await shopRepo.update(id, updateData);

  const shop = await shopRepo.findOne({ where: { id } });
  if (!shop) throw new Error('Shop not found');

  // Publish event
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.SHOP_UPDATED,
    timestamp: new Date(),
    payload: { shopId: id },
  };
  await publishEvent(event);

  return mapShopToInterface(shop);
};

export const updateVerificationStatus = async (
  id: string,
  status: VerificationStatus
): Promise<IShop> => {
  const shopRepo = getShopRepository();

  await shopRepo.update(id, { verificationStatus: status });

  const shop = await shopRepo.findOne({ where: { id } });
  if (!shop) throw new Error('Shop not found');

  // Publish event
  const eventType = status === VerificationStatus.APPROVED 
    ? EventType.SHOP_APPROVED 
    : EventType.SHOP_REJECTED;

  const event: IEvent = {
    id: uuidv4(),
    type: eventType,
    timestamp: new Date(),
    payload: { shopId: id, sellerId: shop.sellerId },
  };
  await publishEvent(event);

  return mapShopToInterface(shop);
};

export const deleteShop = async (id: string): Promise<void> => {
  const shopRepo = getShopRepository();
  await shopRepo.delete(id);

  // Publish event
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.SHOP_DELETED,
    timestamp: new Date(),
    payload: { shopId: id },
  };
  await publishEvent(event);
};

const mapShopToInterface = (shop: Shop): IShop => {
  return {
    id: shop.id,
    slug: shop.slug,
    sellerId: shop.sellerId,
    name: shop.name,
    description: shop.description || '',
    logo: shop.logo,
    banner: shop.banner,
    category: shop.category,
    status: shop.status,
    verificationStatus: shop.verificationStatus,
    isOpen: shop.status === ShopStatus.ACTIVE,
    address: shop.address as any,
    contactPhone: shop.phone,
    contactEmail: shop.email,
    socialLinks: shop.socialLinks as any,
    commissionRate: parseFloat(shop.commissionRate.toString()),
    rating: parseFloat(shop.rating.toString()),
    totalReviews: shop.totalReviews,
    totalSales: shop.totalSales,
    verificationDocuments: shop.verificationDocuments as string[] | undefined,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  };
};
