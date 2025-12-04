import { getProductRepository, Product } from '../config/database';
import { ProductStatus, ProductType, IProduct } from '@crevea/shared';
import { publishEvent } from '../config/kafka';
import { EventType, IEvent } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml, sanitizeText } from '@crevea/shared';
import { Like } from 'typeorm';

interface CreateProductData {
  shopId: string;
  name: string;
  slug: string;
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
    slug: data.slug,
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
