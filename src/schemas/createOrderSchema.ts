import { z } from "zod";

export const createOrderSchema = z.object({
  customerId: z.uuid("customerId must be a valid UUID"),

  shippingAddress: z.object({
    street:     z.string().min(1, "shippingAddress.street is required"),
    number:     z.string().min(1, "shippingAddress.number is required"),
    complement: z.string().optional(),
    city:       z.string().min(3, "shippingAddress.city must be at least 3 characters"),
    state:      z.string().min(2, "shippingAddress.state must be at least 2 characters"),
    country:    z.string().min(3, "shippingAddress.country must be at least 3 characters"),
    zipCode:    z.string().min(3, "shippingAddress.zipCode must be at least 3 characters"),
  }),

  payment: z.object({
    cardNumber:  z.string().regex(/^\d{16}$/, "payment.cardNumber must be exactly 16 digits"),
    holderName:  z.string().min(1, "payment.holderName is required"),
    expiryDate:  z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "payment.expiryDate must be in MM/YY format"),
    cvv:         z.string().regex(/^\d{3}$/, "payment.cvv must be exactly 3 digits"),
  }),

  items: z.array(
    z.object({
      productId: z.uuid("items[].productId must be a valid UUID"),
      quantity:  z.number().int().min(1, "items[].quantity must be at least 1"),
    })
  ).min(1, "Order must contain at least one item"),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;