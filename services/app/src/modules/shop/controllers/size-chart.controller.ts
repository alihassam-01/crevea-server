import { successResponse, NotFoundError } from '@crevea/shared';
import * as sizeChartService from '../services/size-chart.service';
import { assertShopOwnership } from '../services/vendor.service';

export const createSizeChart = async (shopId: string, data: any, userId: string) => {
  await assertShopOwnership(userId, shopId);
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

export const updateSizeChart = async (id: string, data: any, userId: string) => {
  const sizeChart = await sizeChartService.findById(id);
  if (!sizeChart) {
    throw new NotFoundError('Size Chart', id);
  }

  await assertShopOwnership(userId, sizeChart.shopId);

  const updated = await sizeChartService.update(id, data);
  return successResponse(updated);
};

export const deleteSizeChart = async (id: string, userId: string) => {
  const sizeChart = await sizeChartService.findById(id);
  if (!sizeChart) {
    throw new NotFoundError('Size Chart', id);
  }

  await assertShopOwnership(userId, sizeChart.shopId);

  await sizeChartService.deleteSizeChart(id);
};
