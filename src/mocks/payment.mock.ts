/**
 * Mock de pagamento.
 *
 * Em produção, isso seria substituído por um gateway real
 * (Stripe, Adyen, etc).
 *
 * Regra do mock:
 * - cartão "0000000000000000" → declined
 * - qualquer outro → approved
 */

interface PaymentRequest {
  cardNumber: string;
  amount: number;
  description: string;
}

interface PaymentResponse {
  transactionId: string;
  status: "approved" | "declined";
}

interface IPaymentService {
  charge(params: PaymentRequest): Promise<PaymentResponse>;
}

function generateTransactionId(): string {
  return `txn_${crypto.randomUUID()}`;
}

export const paymentMock: IPaymentService = {
  async charge({
    cardNumber,
    amount,
    description,
  }: PaymentRequest): Promise<PaymentResponse> {
    // simula latência de rede (realismo leve)
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (!cardNumber || cardNumber.length !== 16) {
      return {
        transactionId: generateTransactionId(),
        status: "declined",
      };
    }

    // regra de falha explícita do assessment mock
    if (cardNumber === "0000000000000000") {
      return {
        transactionId: generateTransactionId(),
        status: "declined",
      };
    }

    // (opcional) regra leve de “risco” baseada no valor
    if (amount <= 0) {
      return {
        transactionId: generateTransactionId(),
        status: "declined",
      };
    }

    return {
      transactionId: generateTransactionId(),
      status: "approved",
    };
  },
};