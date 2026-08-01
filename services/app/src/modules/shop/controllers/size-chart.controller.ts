import { successResponse, NotFoundError } from '@crevea/shared';
import * as sizeChartService from '../services/size-chart.service';

export const createSizeChart = async (shopId: string, data: any, _userId: string) => {
  // TODO: Verify user owns this shop
  const sizeChart = await sizeChartService.create(shopId, data);
  return successResponse(sizeChart);
};

export const getSizeCharts = async (shopId: string) => {
  const sizeCharts = await sizeChartService.findByShop(shopId);
  return successResponse(sizeCharts);
};

export const getSizeChart = async (id: string) => {
  const sizeChart = await sizeChartService.findById(id);
  if (!sizeChart) {
    throw new NotFoundError('Size Chart', id);
  }
  return successResponse(sizeChart);
};

export const updateSizeChart = async (id: string, data: any, _userId: string) => {
  const sizeChart = await sizeChartService.findById(id);
  if (!sizeChart) {
    throw new NotFoundError('Size Chart', id);
  }

  // TODO: Verify user owns the shop that owns this size chart

  const updated = await sizeChartService.update(id, data);
  return successResponse(updated);
};

export const deleteSizeChart = async (id: string, _userId: string) => {
  const sizeChart = await sizeChartService.findById(id);
  if (!sizeChart) {
    throw new NotFoundError('Size Chart', id);
  }

  // TODO: Verify user owns the shop that owns this size chart

  await sizeChartService.deleteSizeChart(id);
};
