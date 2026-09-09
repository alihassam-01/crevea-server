import { getVendorStoryRepository, VendorStory } from '../../../database';
import { sanitizeHtml, sanitizeText } from '@crevea/shared';
import { VendorStoryInput } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const findPublishedByVendorId = async (vendorId: string): Promise<VendorStory | null> => {
  return getVendorStoryRepository().findOne({ where: { vendorId, published: true } });
};

export const findByVendorId = async (vendorId: string): Promise<VendorStory | null> => {
  return getVendorStoryRepository().findOne({ where: { vendorId } });
};

export const save = async (vendorId: string, input: VendorStoryInput): Promise<VendorStory> => {
  const repository = getVendorStoryRepository();
  const existing = await repository.findOne({ where: { vendorId } });
  const publishedAt = input.published ? (existing?.publishedAt || new Date()) : undefined;
  const data: Partial<VendorStory> = {
    vendorId,
    title: sanitizeText(input.title),
    body: sanitizeHtml(input.body),
    coverImageUrl: input.coverImageUrl,
    images: input.images || [],
    videoUrl: input.videoUrl,
    published: input.published,
    publishedAt,
    updatedAt: new Date(),
  };

  if (existing) {
    await repository.update(existing.id, data);
    const updated = await repository.findOne({ where: { id: existing.id } });
    if (!updated) throw new Error('Vendor story could not be loaded after update');
    return updated;
  }

  return repository.save(repository.create({
    id: uuidv4(),
    ...data,
    createdAt: new Date(),
  }) as VendorStory);
};
