import type { IPaymentService, PaymentRequest, PaymentResult } from "../interfaces/payment.service.interface";

function generateTransactionId(): string {
  return `txn_${crypto.randomUUID()}`;
}

export const paymentMock: IPaymentService = {
  async charge({ cardNumber, amount }: PaymentRequest): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (!cardNumber || cardNumber.length !== 16) {
      return { transactionId: generateTransactionId(), status: "declined" };
    }

    if (cardNumber === "0000000000000000") {
      return { transactionId: generateTransactionId(), status: "declined" };
    }

    if (amount <= 0) {
      return { transactionId: generateTransactionId(), status: "declined" };
    }

    return { transactionId: generateTransactionId(), status: "approved" };
  },
};