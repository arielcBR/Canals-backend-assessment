export interface PaymentRequest {
  cardNumber:  string;
  holderName:  string;
  expiryDate:  string;
  cvv:         string;
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