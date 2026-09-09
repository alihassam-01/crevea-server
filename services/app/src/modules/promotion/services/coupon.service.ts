import { getCouponRepository, getShopRepository, Coupon } from '../../../database';
import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';

export type CouponInput = {
  shopId: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  startsAt: Date;
  endsAt: Date;
};

export const create = async (sellerId: string, input: CouponInput) => {
  const shop = await getShopRepository().findOne({ where: { id: input.shopId } });
  if (!shop) throw new NotFoundError('Shop', input.shopId);
  if (shop.sellerId !== sellerId) throw new AuthorizationError('You can only create coupons for your own shop');
  if (input.endsAt <= input.startsAt) throw new ValidationError('Coupon end date must be after its start date');
  if (input.discountType === 'PERCENTAGE' && input.discountValue > 100) throw new ValidationError('Percentage discount cannot exceed 100%');

  const code = input.code.trim().toUpperCase();
  const existing = await getCouponRepository().findOne({ where: { code } });
  if (existing) throw new ConflictError('A coupon with this code already exists');
  return getCouponRepository().save(getCouponRepository().create({
    id: uuidv4(), shopId: input.shopId, sellerId, code, discountType: input.discountType,
    discountValue: input.discountValue, minPurchaseAmount: input.minPurchaseAmount || 0,
    maxDiscountAmount: input.maxDiscountAmount, usageLimit: input.usageLimit, usageCount: 0,
    startsAt: input.startsAt, endsAt: input.endsAt, active: true, createdAt: new Date(), updatedAt: new Date(),
  }) as Coupon);
};

export const listForSeller = async (sellerId: string) => getCouponRepository().find({ where: { sellerId }, order: { createdAt: 'DESC' } });

export const remove = async (sellerId: string, id: string) => {
  const coupon = await getCouponRepository().findOne({ where: { id } });
  if (!coupon) throw new NotFoundError('Coupon', id);
  if (coupon.sellerId !== sellerId) throw new AuthorizationError('You can only delete your own coupons');
  await getCouponRepository().delete(id);
};

export const validateCode = async (code: string, amount: number) => {
  const coupon = await getCouponRepository().findOne({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!coupon || !coupon.active || now < coupon.startsAt || now > coupon.endsAt || (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) || amount < Number(coupon.minPurchaseAmount)) {
    throw new ValidationError('Coupon is invalid or no longer available');
  }
  const raw = coupon.discountType === 'PERCENTAGE' ? amount * Number(coupon.discountValue) / 100 : Number(coupon.discountValue);
  const discount = Math.min(raw, amount, coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : raw);
  return { id: coupon.id, code: coupon.code, shopId: coupon.shopId, discountType: coupon.discountType, discount: Number(discount.toFixed(2)) };
};

export const consume = async (id: string) => {
  const coupon = await getCouponRepository().findOne({ where: { id } });
  if (!coupon || (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit)) throw new ValidationError('Coupon usage limit has been reached');
  await getCouponRepository().update(id, { usageCount: coupon.usageCount + 1, updatedAt: new Date() });
};
