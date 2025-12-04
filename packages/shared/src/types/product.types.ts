/**
 * Product Status
 */
export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

/**
 * Product Type
 */
export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
}

/**
 * Base Product interface
 */
export interface IProduct {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  type: ProductType;
  status: ProductStatus;
  category: string;
  tags: string[];
  images: string[];
  price: number;
  compareAtPrice?: number;
  currency: string;
  sku?: string;
  weight?: number; // in grams
  dimensions?: IDimensions;
  attributes: IProductAttributes;
  rating: number;
  totalReviews: number;
  totalSales: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dimensions
 */
export interface IDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

/**
 * Product Attributes (polymorphic based on category)
 */
export type IProductAttributes = 
  | ICrochetAttributes 
  | IArtAttributes 
  | IPaintingAttributes 
  | IHandcraftAttributes;

/**
 * Crochet Product Attributes
 */
export interface ICrochetAttributes {
  type: 'CROCHET';
  patternType?: string;
  yarnMaterial: string;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  size: string;
  colors: string[];
  washingInstructions?: string;
}

/**
 * Art Product Attributes
 */
export interface IArtAttributes {
  type: 'ART';
  medium: 'OIL' | 'WATERCOLOR' | 'ACRYLIC' | 'MIXED_MEDIA' | 'OTHER';
  canvasSize: string;
  style: string;
  frameIncluded: boolean;
  frameOptions?: string[];
  isOriginal: boolean;
  yearCreated?: number;
}

/**
 * Painting Product Attributes
 */
export interface IPaintingAttributes {
  type: 'PAINTING';
  medium: 'OIL' | 'WATERCOLOR' | 'ACRYLIC' | 'GOUACHE' | 'OTHER';
  surface: 'CANVAS' | 'PAPER' | 'WOOD' | 'OTHER';
  size: string;
  style: string;
  frameIncluded: boolean;
  isOriginal: boolean;
  yearCreated?: number;
  signed: boolean;
}

/**
 * Handcraft Product Attributes
 */
export interface IHandcraftAttributes {
  type: 'HANDCRAFT';
  materialType: string;
  technique: string;
  dimensions: string;
  customizable: boolean;
  customizationOptions?: string[];
}

/**
 * Product Variation
 */
export interface IProductVariation {
  id: string;
  productId: string;
  name: string;
  options: IVariationOption[];
  createdAt: Date;
}

export interface IVariationOption {
  id: string;
  variationId: string;
  value: string;
  priceAdjustment: number;
  sku?: string;
  stock: number;
  images?: string[];
}

/**
 * Inventory
 */
export interface IInventory {
  id: string;
  productId: string;
  variationId?: string;
  stock: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  restockDate?: Date;
  updatedAt: Date;
}

/**
 * Digital Product Delivery
 */
export interface IDigitalProduct {
  id: string;
  productId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  downloadLimit?: number;
  expiryDays?: number;
}
