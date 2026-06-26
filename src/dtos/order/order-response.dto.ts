export interface OrderItemResponseDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number; 
}

export interface OrderWarehouseResponseDTO {
  name: string;
}

export interface OrderShippingResponseDTO {
  street: string;
  number: string;
  complement?: string | undefined;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface OrderResponseDTO {
  orderId: string;
  status: string;          
  createdAt: Date;         
  warehouse: OrderWarehouseResponseDTO;
  shipping: OrderShippingResponseDTO;
  items: OrderItemResponseDTO[];
  totalAmount: number;
}