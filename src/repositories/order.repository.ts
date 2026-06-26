import { prisma } from "../lib/prisma";
import type { IOrderRepository } from "../interfaces/order.repository.interface";
import { OrderStatus } from '../../generated/prisma/client'
import Decimal from "decimal.js"; // ← remove o "type"

export class OrderRepository implements IOrderRepository {
  async create(data: {
    customerId: string;
    warehouseId: string;
    shippingStreet: string;
    shippingNumber?: string;
    shippingComplement?: string | null;
    shippingCity: string;
    shippingState: string;
    shippingCountry: string;
    shippingZipCode: string;
    totalAmount: Decimal; // ← era number, alinha com o service
    paymentTransactionId: string | null;
    status: OrderStatus;
    items: {
      productId: string;
      quantity: number;
      unitPrice: Decimal;
    }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,
          warehouseId: data.warehouseId,
          shippingStreet: data.shippingStreet,
          shippingNumber: data.shippingNumber ?? "S/N",
          shippingComplement: data.shippingComplement ?? null,
          shippingCity: data.shippingCity,
          shippingState: data.shippingState,
          shippingCountry: data.shippingCountry,
          shippingZipCode: data.shippingZipCode,
          totalAmount: data.totalAmount, 
          paymentTransactionId: data.paymentTransactionId,
          status: data.status,
        },
      });

      await tx.orderItem.createMany({
        data: data.items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice, 
        })),
      });

      for (const item of data.items) {
        await tx.warehouseInventory.update({
          where: {
            warehouseId_productId: {
              warehouseId: data.warehouseId,
              productId: item.productId,
            },
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      return {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt, 
      };
    });
  }
}