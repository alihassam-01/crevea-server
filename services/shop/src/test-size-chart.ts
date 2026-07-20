import 'reflect-metadata';
import { AppDataSource, initDatabase } from './config/database';
import * as sizeChartService from './services/size-chart.service';

const testSizeChartFeature = async () => {
  try {
    // Initialize database
    await initDatabase();
    console.log('✓ Database initialized');

    // Test 1: Create a size chart
    const testShopId = '123e4567-e89b-12d3-a456-426614174000'; // Replace with actual shop ID
    const sizeChart = await sizeChartService.create(testShopId, {
      name: 'Women\'s Clothing Sizes',
      imageUrl: 'https://example.com/size-chart.jpg',
      category: 'CLOTHING',
    });
    console.log('✓ Created size chart:', sizeChart.id);

    // Test 2: List size charts for shop
    const charts = await sizeChartService.findByShop(testShopId);
    console.log(`✓ Found ${charts.length} size chart(s) for shop`);

    // Test 3: Get single size chart
    const retrieved = await sizeChartService.findById(sizeChart.id);
    console.log('✓ Retrieved size chart:', retrieved?.name);

    // Test 4: Update size chart
    const updated = await sizeChartService.update(sizeChart.id, {
      name: 'Updated Women\'s Clothing Sizes',
    });
    console.log('✓ Updated size chart:', updated.name);

    // Test 5: Delete size chart
    await sizeChartService.deleteSizeChart(sizeChart.id);
    console.log('✓ Deleted size chart');

    console.log('\n✅ All size chart tests passed!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testSizeChartFeature();
