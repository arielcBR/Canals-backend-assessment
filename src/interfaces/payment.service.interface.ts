// src/interfaces/payment.service.interface.ts

export interface PaymentRequest {
  cardNumber:  string;
  amount:      number;
  description: string;
}

export interface PaymentResult {
  transactionId: string;
  status:        "approved" | "declined";
}

export interface IPaymentService {
  charge(data: PaymentRequest): Promise<PaymentResult>;
}