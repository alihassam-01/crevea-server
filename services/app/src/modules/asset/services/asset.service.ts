import { createHash, randomUUID } from 'node:crypto';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { getAssetRepository, getProductRepository, getShopRepository, getVendorStoryRepository, getOrderRepository } from '../../../database';
import { getRedis } from '../../../redis';
import { AuthorizationError, NotFoundError, ValidationError } from '@crevea/shared';

type AssetRequest = {
  domain: 'users' | 'shops' | 'products' | 'stories' | 'reviews' | 'orders';
  entityId: string;
  assetType: 'profile' | 'logo' | 'banner' | 'images' | 'cover' | 'media' | 'payment-proof' | 'verification';
  contentType: string;
  size: number;
  checksum?: string;
};

type PendingUpload = AssetRequest & { uploadId: string; userId: string; tempKey: string; createdAt: string };

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
const variants = [
  { name: 'original', width: 2400, quality: 86 },
  { name: 'large', width: 1600, quality: 84 },
  { name: 'medium', width: 800, quality: 82 },
  { name: 'thumbnail', width: 320, quality: 78 },
] as const;

const maxAssets = (request: Pick<AssetRequest, 'domain' | 'assetType'>) => {
  if (request.domain === 'products' && request.assetType === 'images') return 5;
  if (request.domain === 'stories' && request.assetType === 'cover') return 3;
  if (request.domain === 'users' && request.assetType === 'verification') return 3;
  return 1;
};

const maxBytes = () => Number(process.env.R2_MAX_IMAGE_BYTES || 10 * 1024 * 1024);
const environment = () => process.env.NODE_ENV === 'production' ? 'production' : 'dev';
const bucket = () => process.env.R2_BUCKET_NAME;

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  } : undefined,
});

const publicUrl = (key: string) => {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) throw new Error('R2_PUBLIC_URL is required for asset URLs');
  return `${base.replace(/\/$/, '')}/${key}`;
};

const objectKey = (request: Pick<AssetRequest, 'domain' | 'entityId' | 'assetType'>, assetId: string, variant: string) =>
  `${environment()}/${request.domain}/${request.entityId}/${request.assetType}/${assetId}/${variant}.webp`;

const temporaryKey = (userId: string, uploadId: string) => `${environment()}/temporary/${userId}/${uploadId}/source`;

const assertConfigured = () => {
  if (!bucket() || !process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 storage is not configured');
  }
};

const assertRequest = (request: AssetRequest) => {
  if (!allowedImageTypes.has(request.contentType)) throw new ValidationError('Only JPEG, PNG, WebP, AVIF, and GIF images are supported');
  if (!Number.isInteger(request.size) || request.size <= 0 || request.size > maxBytes()) throw new ValidationError(`Image must be between 1 byte and ${maxBytes()} bytes`);
  const validType = (request.domain === 'users' && ['profile', 'verification'].includes(request.assetType))
    || (request.domain === 'shops' && ['logo', 'banner'].includes(request.assetType))
    || (request.domain === 'products' && request.assetType === 'images')
    || (request.domain === 'stories' && request.assetType === 'cover')
    || (request.domain === 'reviews' && request.assetType === 'media')
    || (request.domain === 'orders' && request.assetType === 'payment-proof');
  if (!validType) throw new ValidationError('Invalid asset type for this domain');
};

const assertOwnership = async (userId: string, request: Pick<AssetRequest, 'domain' | 'entityId'>) => {
  if (request.domain === 'users' && request.entityId === userId) return;
  if (request.domain === 'shops') {
    const shop = await getShopRepository().findOne({ where: { id: request.entityId } });
    if (!shop) throw new NotFoundError('Shop', request.entityId);
    if (shop.sellerId !== userId) throw new AuthorizationError('You can only upload assets to your own shop');
    return;
  }
  if (request.domain === 'products') {
    const product = await getProductRepository().findOne({ where: { id: request.entityId } });
    if (!product) throw new NotFoundError('Product', request.entityId);
    const shop = await getShopRepository().findOne({ where: { id: product.shopId } });
    if (!shop || shop.sellerId !== userId) throw new AuthorizationError('You can only upload assets to your own products');
    return;
  }
  if (request.domain === 'stories') {
    const story = await getVendorStoryRepository().findOne({ where: { id: request.entityId } });
    if (!story) throw new NotFoundError('Story', request.entityId);
    if (story.vendorId !== userId) throw new AuthorizationError('You can only upload your own story assets');
    return;
  }
  if (request.domain === 'orders') {
    const order = await getOrderRepository().findOne({ where: { id: request.entityId } });
    if (!order) throw new NotFoundError('Order', request.entityId);
    if (order.customerId !== userId) throw new AuthorizationError('You can only upload payment proof for your own orders');
    return;
  }
  throw new AuthorizationError('You are not allowed to upload this asset');
};

const getObjectBuffer = async (key: string): Promise<Buffer> => {
  const response = await r2.send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  if (!response.Body) throw new Error('Uploaded object is empty');
  return Buffer.from(await response.Body.transformToByteArray());
};

export const createUpload = async (userId: string, input: AssetRequest) => {
  assertConfigured();
  assertRequest(input);
  await assertOwnership(userId, input);

  const existingAssets = await getAssetRepository().find({ where: { domain: input.domain, entityId: input.entityId, assetType: input.assetType } });
  const existingAssetIds = new Set(existingAssets.map(asset => asset.assetId));
  if (existingAssetIds.size >= maxAssets(input)) throw new ValidationError(`This ${input.assetType} collection allows up to ${maxAssets(input)} image${maxAssets(input) === 1 ? '' : 's'}`);

  const redis = getRedis();
  const rateKey = `asset-upload-rate:${userId}:${Math.floor(Date.now() / 60_000)}`;
  const uploadCount = await redis.incr(rateKey);
  if (uploadCount === 1) await redis.expire(rateKey, 120);
  if (uploadCount > 20) throw new ValidationError('Too many uploads. Please try again in a minute');

  const uploadId = randomUUID();
  const pending: PendingUpload = { ...input, uploadId, userId, tempKey: temporaryKey(userId, uploadId), createdAt: new Date().toISOString() };
  await getRedis().setex(`asset-upload:${uploadId}`, 600, JSON.stringify(pending));

  const expiresIn = Math.min(Number(process.env.R2_PRESIGN_EXPIRES_SECONDS || 600), 900);
  const uploadUrl = await getSignedUrl(r2, new PutObjectCommand({ Bucket: bucket(), Key: pending.tempKey, ContentType: input.contentType }), { expiresIn });
  return { uploadId, uploadUrl, expiresIn, maxBytes: maxBytes(), contentType: input.contentType, method: 'PUT' };
};

export const finalizeUpload = async (userId: string, uploadId: string) => {
  assertConfigured();
  const redis = getRedis();
  const raw = await redis.get(`asset-upload:${uploadId}`);
  if (!raw) throw new ValidationError('Upload has expired or is already finalized');
  const pending = JSON.parse(raw) as PendingUpload;
  if (pending.userId !== userId) throw new AuthorizationError('You do not own this upload');

  const head = await r2.send(new HeadObjectCommand({ Bucket: bucket(), Key: pending.tempKey }));
  if (!head.ContentLength || head.ContentLength > maxBytes()) throw new ValidationError('Uploaded image is too large');
  const source = await getObjectBuffer(pending.tempKey);
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height || metadata.width > 10000 || metadata.height > 10000) throw new ValidationError('Image dimensions are not supported');
  const hash = createHash('sha256').update(source).digest('hex');
  if (pending.checksum && pending.checksum !== hash) throw new ValidationError('Uploaded file checksum does not match');
  const assetId = randomUUID();
  const assetRepo = getAssetRepository();
  const existing = await assetRepo.findOne({ where: { domain: pending.domain, entityId: pending.entityId, assetType: pending.assetType, contentHash: hash, variant: 'original' } });
  if (existing) {
    await r2.send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: [{ Key: pending.tempKey }] } }));
    await redis.del(`asset-upload:${uploadId}`);
    const existingVariants = await assetRepo.find({ where: { assetId: existing.assetId } });
    return { assetId: existing.assetId, deduplicated: true, variants: existingVariants.map(asset => ({ variant: asset.variant, url: publicUrl(asset.objectKey), key: asset.objectKey })) };
  }

  const result: Array<{ variant: string; url: string; key: string }> = [];
  try {
    for (const variant of variants) {
      const output = await sharp(source).rotate().resize({ width: variant.width, height: variant.width, fit: 'inside', withoutEnlargement: true }).webp({ quality: variant.quality }).toBuffer();
      const key = objectKey(pending, assetId, variant.name);
      await r2.send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: output, ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable' }));
      await assetRepo.save({ id: randomUUID(), environment: environment(), domain: pending.domain, entityId: pending.entityId, assetType: pending.assetType, assetId, variant: variant.name, objectKey: key, contentHash: hash, mimeType: 'image/webp', size: output.byteLength, uploadedBy: userId, createdAt: new Date(), updatedAt: new Date() });
      result.push({ variant: variant.name, url: publicUrl(key), key });
    }
  } catch (error) {
    const keys = result.map(item => ({ Key: item.key }));
    if (keys.length) await r2.send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: keys } }));
    throw error;
  } finally {
    await r2.send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: [{ Key: pending.tempKey }] } }));
    await redis.del(`asset-upload:${uploadId}`);
  }
  return { assetId, deduplicated: false, variants: result };
};

export const deleteAsset = async (userId: string, assetId: string) => {
  assertConfigured();
  const repo = getAssetRepository();
  const assets = await repo.find({ where: { assetId } });
  if (!assets.length) throw new NotFoundError('Asset', assetId);
  await assertOwnership(userId, { domain: assets[0].domain as AssetRequest['domain'], entityId: assets[0].entityId });
  await r2.send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: assets.map(asset => ({ Key: asset.objectKey })) } }));
  await repo.delete({ assetId });
};

export const deleteEntityAssets = async (domain: AssetRequest['domain'], entityId: string) => {
  assertConfigured();
  const repo = getAssetRepository();
  const assets = await repo.find({ where: { domain, entityId } });
  if (!assets.length) return;
  await r2.send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: assets.map(asset => ({ Key: asset.objectKey })) } }));
  await repo.delete({ domain, entityId });
};

export const assertOwnedVerificationAssets = async (userId: string, assetIds: string[]) => {
  const assets = await getAssetRepository().find({ where: { domain: 'users', entityId: userId, assetType: 'verification' } });
  const ownedIds = new Set(assets.map((asset) => asset.assetId));
  if (assetIds.length !== 3 || new Set(assetIds).size !== 3 || assetIds.some((assetId) => !ownedIds.has(assetId))) {
    throw new ValidationError('Upload all required vendor verification documents before continuing');
  }
};
