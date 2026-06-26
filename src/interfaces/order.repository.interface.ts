import type Decimal from 'decimal.js';
import { OrderStatus } from '../../generated/prisma/client'

export interface IOrderRepository {
  create(data: {
    customerId: string;
    warehouseId: string;
    
    shippingStreet: string;
    shippingNumber?: string;
    shippingComplement?: string | null;
    shippingCity: string;
    shippingState: string;
    shippingCountry: string;
    shippingZipCode: string;

    totalAmount: Decimal;
    paymentTransactionId: string | null;
    status: OrderStatus;
    
    items: {
      productId: string;
      quantity: number;
      unitPrice: Decimal;
    }[];
  }): Promise<{ id: string; status: string }>;
}