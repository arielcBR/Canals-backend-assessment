import type Decimal from "decimal.js";

export type OrderItemEnrichedDTO = {
  productId: string;
  quantity: number;
  unitPrice: Decimal;
}
