import { prisma } from "../lib/prisma";
import type { IWarehouseRepository } from "../interfaces/warehouse.repository.interface";

type Item = {
  productId: string;
  quantity: number;
};

export class WarehouseRepository implements IWarehouseRepository {
  async findWarehousesWithStock(items: Item[]) {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        inventories: true,
      },
    });

    const validWarehouses = [];

    for (const warehouse of warehouses) {
      let hasAllItems = true;

      for (const item of items) {
        const stockItem = warehouse.inventories.find(
          (inv) => inv.productId === item.productId
        );

        if (!stockItem || stockItem.quantity < item.quantity) {
          hasAllItems = false;
          break;
        }
      }

      if (hasAllItems) {
        validWarehouses.push({
          id: warehouse.id,
          name: warehouse.name,
          latitude: warehouse.latitude,
          longitude: warehouse.longitude,
        });
      }
    }

    return validWarehouses;
  }
}