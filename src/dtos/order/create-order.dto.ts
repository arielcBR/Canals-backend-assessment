export interface CreateOrderDTO {
  customerId: string;

  shippingAddress: {
    street: string;
    number: string;
    complement?: string;
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

  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}