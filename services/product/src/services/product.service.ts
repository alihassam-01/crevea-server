import { getProductRepository, getProductVariationRepository, Product } from '../config/database';
import { ProductStatus, ProductType, IProduct } from '@crevea/shared';
import { publishEvent } from '../config/kafka';
import { EventType, IEvent } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml, sanitizeText } from '@crevea/shared';
import { Like } from 'typeorm';

// Simple slugify utility: lowercases, removes diacritics, non-alphanumerics -> hyphens
const slugify = (text: string): string => {
  return text
    .toString()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const generateUniqueSlug = async (productRepo: any, name: string): Promise<string> => {
  const base = slugify(name || 'product');
  let slug = base;
  let attempt = 0;

  // Check for existing slug and append a counter until unique
  // Limit attempts to avoid infinite loops
  while (attempt < 100) {
    const existing = await productRepo.findOne({ where: { slug } });
    if (!existing) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  // Fallback to a UUID-based slug
  return `${base}-${uuidv4().slice(0, 8)}`;
};

interface CreateProductData {
  shopId: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  type: ProductType;
  category: string;
  tags?: string[];
  images?: string[];
  price: number;
  compareAtPrice?: number;
  sku?: string;
  weight?: number;
  dimensions?: any;
  attributes: any;
}

export const create = async (data: CreateProductData): Promise<IProduct> => {
  const productRepo = getProductRepository();

  // Sanitize text inputs
  const sanitizedName = sanitizeText(data.name);
  const sanitizedDescription = data.description ? sanitizeHtml(data.description) : undefined;
  const sanitizedShortDescription = data.shortDescription ? sanitizeText(data.shortDescription) : undefined;

  // Create product
  const product = productRepo.create({
    shopId: data.shopId,
    name: sanitizedName,
    slug: data.slug || await generateUniqueSlug(productRepo, sanitizedName),
    description: sanitizedDescription,
    shortDescription: sanitizedShortDescription,
    type: data.type,
    status: ProductStatus.DRAFT,
    category: data.category,
    tags: data.tags || [],
    images: data.images || [],
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    currency: 'ZAR',
    sku: data.sku,
    weight: data.weight,
    dimensions: data.dimensions,
    attributes: data.attributes,
    rating: 0,
    totalReviews: 0,
    totalSales: 0,
    isFeatured: false,
  });

  await productRepo.save(product);

  // Publish event
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.PRODUCT_CREATED,
    timestamp: new Date(),
    payload: {
      productId: product.id,
      shopId: data.shopId,
      name: sanitizedName,
    },
  };
  await publishEvent(event);

  return mapProductToInterface(product);
};

export const findById = async (id: string): Promise<IProduct | null> => {
  const productRepo = getProductRepository();
  const product = await productRepo.findOne({ where: { id } });
  return product ? mapProductToInterface(product) : null;
};

export const findBySlug = async (slug: string): Promise<IProduct | null> => {
  const productRepo = getProductRepository();
  const product = await productRepo.findOne({ where: { slug } });
  return product ? mapProductToInterface(product) : null;
};

export const findByShop = async (
  shopId: string,
  options: { page: number; limit: number }
): Promise<{ products: IProduct[]; total: number }> => {
  const productRepo = getProductRepository();
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [products, total] = await productRepo.findAndCount({
    where: { shopId },
    order: { createdAt: 'DESC' },
    take: limit,
    skip,
  });

  return {
    products: products.map(mapProductToInterface),
    total,
  };
};

export const search = async (
  query: string,
  options: { page: number; limit: number }
): Promise<{ products: IProduct[]; total: number }> => {
  const productRepo = getProductRepository();
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [products, total] = await productRepo.findAndCount({
    where: [
      { name: Like(`%${query}%`) },
      { description: Like(`%${query}%`) },
      { category: Like(`%${query}%`) },
    ],
    order: { createdAt: 'DESC' },
    take: limit,
    skip,
  });

  return {
    products: products.map(mapProductToInterface),
    total,
  };
};

export const list = async (options: {
  page: number;
  limit: number;
  category?: string;
  status?: ProductStatus;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<{ products: IProduct[]; total: number }> => {
  const productRepo = getProductRepository();
  const { page, limit, category, status, search, minPrice, maxPrice } = options;
  const skip = (page - 1) * limit;

  const qb = productRepo.createQueryBuilder('product');
  
  if (category) qb.andWhere('product.category = :category', { category });
  if (status) qb.andWhere('product.status = :status', { status });
  if (minPrice) qb.andWhere('product.price >= :minPrice', { minPrice });
  if (maxPrice) qb.andWhere('product.price <= :maxPrice', { maxPrice });
  if (search) {
    qb.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', { search: `%${search}%` });
  }

  qb.orderBy('product.createdAt', 'DESC');
  qb.skip(skip).take(limit);

  const [products, total] = await qb.getManyAndCount();

  return {
    products: products.map(mapProductToInterface),
    total,
  };
};

export const addVariation = async (productId: string, data: any): Promise<any> => {
  const variationRepo = getProductVariationRepository();
  
  const variation = variationRepo.create({
    productId,
    name: data.name,
    sku: data.sku,
    priceAdjustment: data.priceAdjustment || 0,
    stock: data.stock || 0,
    images: data.images || [],
  });

  await variationRepo.save(variation);
  return variation;
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<IProduct> => {
  const productRepo = getProductRepository();

  // Sanitize if updating text fields
  const updateData: any = { ...data };
  if (updateData.name) updateData.name = sanitizeText(updateData.name);
  if (updateData.description) updateData.description = sanitizeHtml(updateData.description);
  if (updateData.shortDescription) updateData.shortDescription = sanitizeText(updateData.shortDescription);

  await productRepo.update(id, updateData);

  const product = await productRepo.findOne({ where: { id } });
  if (!product) throw new Error('Product not found');

  // Publish event
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.PRODUCT_UPDATED,
    timestamp: new Date(),
    payload: { productId: id },
  };
  await publishEvent(event);

  return mapProductToInterface(product);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const productRepo = getProductRepository();
  await productRepo.delete(id);

  // Publish event
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.PRODUCT_DELETED,
    timestamp: new Date(),
    payload: { productId: id },
  };
  await publishEvent(event);
};

const mapProductToInterface = (product: Product): IProduct => {
  return {
    id: product.id,
    shopId: product.shopId,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    shortDescription: product.shortDescription,
    type: product.type,
    status: product.status,
    category: product.category,
    tags: product.tags,
    images: product.images,
    price: parseFloat(product.price.toString()),
    compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : undefined,
    currency: product.currency || 'ZAR',
    sku: product.sku,
    weight: product.weight,
    dimensions: product.dimensions as any,
    attributes: product.attributes as any,
    rating: parseFloat(product.rating.toString()),
    totalReviews: product.totalReviews,
    totalSales: product.totalSales,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};
