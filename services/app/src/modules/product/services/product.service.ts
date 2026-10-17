import { getProductRepository, getProductVariationRepository, getShopRepository, getInventoryRepository, Product, Shop, contains } from '../../../database';
import { ProductStatus, ProductType, IProduct, getEventBus } from '@crevea/shared';
import { EventType, IEvent } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml, sanitizeText } from '@crevea/shared';

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
  salePercent?: number;
  saleStartsAt?: Date | null;
  saleEndsAt?: Date | null;
  sku?: string;
  weight?: number;
  dimensions?: any;
  attributes?: any;
  sizeChartId?: string;
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
    // Product creation is the publish action in the current vendor UI. The
    // form sends ACTIVE, but the API schema intentionally controls this value
    // so new products must not remain invisible as DRAFT records.
    status: ProductStatus.ACTIVE,
    category: data.category.toUpperCase(),
    tags: (data.tags || []).map(t => t.toLowerCase()),
    images: data.images || [],
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    salePercent: data.salePercent || 0,
    saleStartsAt: data.saleStartsAt || undefined,
    saleEndsAt: data.saleEndsAt || undefined,
    currency: 'ZAR',
    sku: data.sku,
    weight: data.weight,
    dimensions: data.dimensions,
    attributes: data.attributes || {},
    rating: 0,
    totalReviews: 0,
    totalSales: 0,
    isFeatured: false,
    sizeChartId: data.sizeChartId,
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
  await getEventBus().publish(event);

  return mapProductToInterface(product);
};

export const findById = async (id: string): Promise<IProduct | null> => {
  const productRepo = getProductRepository();
  const product = await productRepo.findOne({ where: { id } });
  const shop = product ? await getShopRepository().findOne({ where: { id: product.shopId } }) : null;
  return product ? mapProductToInterface(product, shop || undefined) : null;
};

export const findBySlug = async (slug: string): Promise<IProduct | null> => {
  const productRepo = getProductRepository();
  const product = await productRepo.findOne({ where: { slug } });
  const shop = product ? await getShopRepository().findOne({ where: { id: product.shopId } }) : null;
  return product ? mapProductToInterface(product, shop || undefined) : null;
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

  const shop = await getShopRepository().findOne({ where: { id: shopId } });
  return {
    products: products.map(product => mapProductToInterface(product, shop || undefined)),
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
      { name: contains(query) },
      { description: contains(query) },
      { category: contains(query) },
    ],
    order: { createdAt: 'DESC' },
    take: limit,
    skip,
  });

  const shops = await getShopRepository().find({ where: [...new Set(products.map(product => product.shopId))].map(id => ({ id })) });
  const shopsById = new Map(shops.map(shop => [shop.id, shop]));
  return {
    products: products.map(product => mapProductToInterface(product, shopsById.get(product.shopId))),
    total,
  };
};

export const list = async (options: {
  page: number;
  limit: number;
  category?: string | string[];
  status?: ProductStatus;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  inStock?: boolean;
  isHandmade?: boolean;
}): Promise<{ products: IProduct[]; total: number }> => {
  const productRepo = getProductRepository();
  const { page, limit, category, status, search, minPrice, maxPrice, sortBy, inStock, isHandmade } = options;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (category) {
    const rawCategories = Array.isArray(category)
      ? category
      : String(category).split(',').map(c => c.trim()).filter(Boolean);

    if (rawCategories.length > 0) {
      const allCategoryVariants = new Set<string>();
      for (const cat of rawCategories) {
        const lower = cat.toLowerCase();
        if (['crochet', 'crochets'].includes(lower)) {
          allCategoryVariants.add('Crochet');
          allCategoryVariants.add('CROCHET');
          allCategoryVariants.add('crochet');
        } else if (['art', 'arts'].includes(lower)) {
          allCategoryVariants.add('Art');
          allCategoryVariants.add('ART');
          allCategoryVariants.add('art');
        } else if (['painting', 'paintings'].includes(lower)) {
          allCategoryVariants.add('Painting');
          allCategoryVariants.add('PAINTING');
          allCategoryVariants.add('painting');
        } else if (['handcraft', 'handcrafts', 'handicraft', 'handicrafts', 'craft', 'crafts'].includes(lower)) {
          allCategoryVariants.add('Handcraft');
          allCategoryVariants.add('HANDCRAFT');
          allCategoryVariants.add('handcraft');
          allCategoryVariants.add('Handicraft');
          allCategoryVariants.add('HANDICRAFT');
          allCategoryVariants.add('handicraft');
        } else {
          allCategoryVariants.add(cat);
          allCategoryVariants.add(cat.toLowerCase());
          allCategoryVariants.add(cat.toUpperCase());
          allCategoryVariants.add(cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
        }
      }
      where.category = { __in: Array.from(allCategoryVariants) };
    }
  }
  if (status) {
    where.status = status;
  } else if (inStock) {
    where.status = ProductStatus.ACTIVE;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Record<string, unknown> = {};
    if (minPrice !== undefined) priceFilter.__gte = minPrice;
    if (maxPrice !== undefined) priceFilter.__lte = maxPrice;
    where.price = priceFilter;
  }
  if (isHandmade) {
    where.tags = { __has: 'handmade' };
  }
  if (search) {
    where.OR = [
      { name: contains(search) },
      { description: contains(search) },
    ];
  }

  let order: Record<string, 'ASC' | 'DESC'> = { createdAt: 'DESC' };
  if (sortBy === 'price-low') {
    order = { price: 'ASC' };
  } else if (sortBy === 'price-high') {
    order = { price: 'DESC' };
  } else if (sortBy === 'rating') {
    order = { rating: 'DESC' };
  } else if (sortBy === 'popular') {
    order = { totalReviews: 'DESC' };
  } else if (sortBy === 'newest') {
    order = { createdAt: 'DESC' };
  }

  const [products, total] = await productRepo.findAndCount({
    where,
    order,
    skip,
    take: limit,
  });
  const shops = await getShopRepository().find({ where: [...new Set(products.map(product => product.shopId))].map(id => ({ id })) });
  const shopsById = new Map(shops.map(shop => [shop.id, shop]));
  const productIds = products.map(p => p.id);
  const inventories = productIds.length > 0 
    ? await getInventoryRepository().find({ where: { productId: { __in: productIds } } })
    : [];
  const inventoryByProductId = new Map(inventories.map(inv => [inv.productId, inv]));

  return {
    products: products.map(product => {
      const mapped = mapProductToInterface(product, shopsById.get(product.shopId));
      const inv = inventoryByProductId.get(product.id);
      if (inv) {
        mapped.stock = inv.available;
      } else {
        mapped.stock = product.status === ProductStatus.ACTIVE ? 10 : 0;
      }
      return mapped;
    }),
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
  if (updateData.category) updateData.category = updateData.category.toUpperCase();
  if (updateData.tags) updateData.tags = updateData.tags.map((t: string) => t.toLowerCase());

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
  await getEventBus().publish(event);

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
  await getEventBus().publish(event);
};

const mapProductToInterface = (product: Product, shop?: Shop): IProduct => {
  const now = Date.now();
  const productSaleActive = Number(product.salePercent) > 0 && (!product.saleStartsAt || product.saleStartsAt.getTime() <= now) && (!product.saleEndsAt || product.saleEndsAt.getTime() >= now);
  const shopSaleActive = Boolean(shop) && Number(shop?.salePercent) > 0 && (!shop?.saleStartsAt || shop.saleStartsAt.getTime() <= now) && (!shop?.saleEndsAt || shop.saleEndsAt.getTime() >= now);
  const salePercent = productSaleActive ? Number(product.salePercent) : (shopSaleActive ? Number(shop!.salePercent) : 0);
  const basePrice = parseFloat(product.price.toString());
  const salePrice = salePercent ? Number((basePrice * (1 - salePercent / 100)).toFixed(2)) : basePrice;
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
    price: salePrice,
    compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : (salePercent ? basePrice : undefined),
    salePercent: parseFloat(product.salePercent.toString()),
    saleStartsAt: product.saleStartsAt,
    saleEndsAt: product.saleEndsAt,
    currency: product.currency || 'ZAR',
    sku: product.sku,
    weight: product.weight,
    dimensions: product.dimensions as any,
    attributes: product.attributes as any,
    rating: parseFloat(product.rating.toString()),
    totalReviews: product.totalReviews,
    totalSales: product.totalSales,
    isFeatured: product.isFeatured,
    sizeChartId: product.sizeChartId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};
