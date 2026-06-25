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

    totalAmount: number;
    paymentTransactionId: string | null;
    status: OrderStatus;
    
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }): Promise<{ id: string; status: string }>;
}