import { AuthorizationError, successResponse } from '@crevea/shared';
import * as vendorStoryService from '../services/vendor-story.service';
import { VendorStoryInput } from '../types';

export const getPublishedStory = async (vendorId: string) => {
  const story = await vendorStoryService.findPublishedByVendorId(vendorId);
  return successResponse(story);
};

export const getOwnStory = async (vendorId: string) => {
  const story = await vendorStoryService.findByVendorId(vendorId);
  return successResponse(story);
};

export const saveOwnStory = async (vendorId: string, input: VendorStoryInput) => {
  if (!vendorId) throw new AuthorizationError('A vendor account is required');
  return successResponse(await vendorStoryService.save(vendorId, input));
};
