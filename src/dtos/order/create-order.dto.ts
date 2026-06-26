export type OrderItemDTO = {
  productId: string;
  quantity: number;
}

export interface CreateOrderDTO {
  customerId: string;

  shippingAddress: {
    street: string;
    number: string;
    complement?: string | undefined;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };

  payment: {
    cardNumber: string;
    holderName: string;
    expiryDate: string;
    cvv: string;
  };

  items: OrderItemDTO[];
}