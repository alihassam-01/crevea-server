import { getInventoryRepository, Inventory } from '../config/database';
import { publishEvent } from '../config/kafka';
import { EventType, IEvent } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';


export const getInventory = async (productId: string): Promise<Inventory | null> => {
  const inventoryRepo = getInventoryRepository();
  const inventory = await inventoryRepo.findOne({ where: { productId } });
  return inventory || null;
};

export const updateInventory = async (
  productId: string,
  data: { stock?: number; reserved?: number; lowStockThreshold?: number }
): Promise<Inventory> => {
  const inventoryRepo = getInventoryRepository();

  let inventory = await inventoryRepo.findOne({ where: { productId } });

  if (!inventory) {
    // Create new inventory record
    inventory = inventoryRepo.create({
      productId,
      stock: data.stock || 0,
      reserved: 0,
      available: data.stock || 0,
      lowStockThreshold: data.lowStockThreshold || 10,
    });
  } else {
    // Update existing
    if (data.stock !== undefined) {
      inventory.stock = data.stock;
      inventory.available = inventory.stock - inventory.reserved;
    }
    if (data.reserved !== undefined) {
      inventory.reserved = data.reserved;
      inventory.available = inventory.stock - inventory.reserved;
    }
    if (data.lowStockThreshold !== undefined) {
      inventory.lowStockThreshold = data.lowStockThreshold;
    }
    inventory.updatedAt = new Date();
  }

  await inventoryRepo.save(inventory);

  // Check if low stock
  if (inventory.available <= inventory.lowStockThreshold) {
    const event: IEvent = {
      id: uuidv4(),
      type: EventType.PRODUCT_LOW_STOCK,
      timestamp: new Date(),
      payload: {
        productId,
        available: inventory.available,
        threshold: inventory.lowStockThreshold,
      },
    };
    await publishEvent(event);
  }

  // Check if out of stock
  if (inventory.available <= 0) {
    const event: IEvent = {
      id: uuidv4(),
      type: EventType.PRODUCT_OUT_OF_STOCK,
      timestamp: new Date(),
      payload: { productId },
    };
    await publishEvent(event);
  }

  return inventory;
};

export const reserveStock = async (productId: string, quantity: number): Promise<boolean> => {
  const inventoryRepo = getInventoryRepository();
  const inventory = await inventoryRepo.findOne({ where: { productId } });

  if (!inventory || inventory.available < quantity) {
    return false;
  }

  inventory.reserved += quantity;
  inventory.available = inventory.stock - inventory.reserved;
  inventory.updatedAt = new Date();

  await inventoryRepo.save(inventory);
  return true;
};

export const releaseStock = async (productId: string, quantity: number): Promise<void> => {
  const inventoryRepo = getInventoryRepository();
  const inventory = await inventoryRepo.findOne({ where: { productId } });

  if (inventory) {
    inventory.reserved = Math.max(0, inventory.reserved - quantity);
    inventory.available = inventory.stock - inventory.reserved;
    inventory.updatedAt = new Date();
    await inventoryRepo.save(inventory);
  }
};

export const confirmStock = async (productId: string, quantity: number): Promise<void> => {
  const inventoryRepo = getInventoryRepository();
  const inventory = await inventoryRepo.findOne({ where: { productId } });

  if (inventory) {
    inventory.stock -= quantity;
    inventory.reserved = Math.max(0, inventory.reserved - quantity);
    inventory.available = inventory.stock - inventory.reserved;
    inventory.updatedAt = new Date();
    await inventoryRepo.save(inventory);
  }
};
