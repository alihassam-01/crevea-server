import { getSizeChartRepository, SizeChart } from '../../../database';
import { ISizeChart } from '@crevea/shared';

export const create = async (shopId: string, data: {
  name: string;
  imageUrl: string;
  category?: string;
}): Promise<ISizeChart> => {
  const sizeChartRepo = getSizeChartRepository();

  const sizeChart = sizeChartRepo.create({
    shopId,
    name: data.name,
    imageUrl: data.imageUrl,
    category: data.category,
  });

  await sizeChartRepo.save(sizeChart);

  return mapSizeChartToInterface(sizeChart);
};

export const findByShop = async (shopId: string): Promise<ISizeChart[]> => {
  const sizeChartRepo = getSizeChartRepository();
  const sizeCharts = await sizeChartRepo.find({
    where: { shopId },
    order: { createdAt: 'DESC' },
  });

  return sizeCharts.map(mapSizeChartToInterface);
};

export const findById = async (id: string): Promise<ISizeChart | null> => {
  const sizeChartRepo = getSizeChartRepository();
  const sizeChart = await sizeChartRepo.findOne({ where: { id } });
  return sizeChart ? mapSizeChartToInterface(sizeChart) : null;
};

export const update = async (id: string, data: {
  name?: string;
  imageUrl?: string;
  category?: string;
}): Promise<ISizeChart> => {
  const sizeChartRepo = getSizeChartRepository();

  await sizeChartRepo.update(id, data);

  const sizeChart = await sizeChartRepo.findOne({ where: { id } });
  if (!sizeChart) throw new Error('Size chart not found');

  return mapSizeChartToInterface(sizeChart);
};

export const deleteSizeChart = async (id: string): Promise<void> => {
  const sizeChartRepo = getSizeChartRepository();
  await sizeChartRepo.delete(id);
};

const mapSizeChartToInterface = (sizeChart: SizeChart): ISizeChart => {
  return {
    id: sizeChart.id,
    shopId: sizeChart.shopId,
    name: sizeChart.name,
    imageUrl: sizeChart.imageUrl,
    category: sizeChart.category,
    createdAt: sizeChart.createdAt,
    updatedAt: sizeChart.updatedAt,
  };
};
