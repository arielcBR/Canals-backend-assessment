import { prisma } from "../lib/prisma";
import type { IOrderRepository } from "../interfaces/order.repository.interface";
// Importe o enum gerado pelo Prisma para o status bater certinho
import { OrderStatus } from "@prisma/client"; 

export class OrderRepository implements IOrderRepository {
  async create(data: {
    customerId: string;
    warehouseId: string;
    
    // Novos campos alinhados com o seu schema.prisma
    shippingStreet: string;
    shippingNumber?: string;
    shippingComplement?: string | null;
    shippingCity: string;
    shippingState: string;
    shippingCountry: string;
    shippingZipCode: string;

    // Alterado para Decimal, vamos tipar como number aqui e o Prisma converte
    totalAmount: number;
    paymentTransactionId: string | null;
    status: OrderStatus;
    
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. criar order
      // 1. criar order
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,
          warehouseId: data.warehouseId,
          
          shippingStreet: data.shippingStreet,
          shippingNumber: data.shippingNumber ?? "S/N", 
          
          // BLINDAGEM AQUI: Força o fallback para null se chegar undefined
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

      // 2. criar items
      await tx.orderItem.createMany({
        data: data.items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      // 3. atualizar estoque do warehouse
      for (const item of data.items) {
        await tx.warehouseInventory.update({
          where: {
            warehouseId_productId: {
              warehouseId: data.warehouseId,
              productId: item.productId,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return {
        id: order.id,
        status: order.status,
      };
    });
  }
}