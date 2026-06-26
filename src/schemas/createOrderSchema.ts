import { z } from "zod";

export const createOrderSchema = z.object({
  customerId: z.uuid("Invalid customer ID format"),

  shippingAddress: z.object({
    street: z.string().min(1, "Street is required"),
    number: z.string().min(1, "Number is required"),
    complement: z.string().optional(),
    city: z.string().min(3, "City is required"),
    state: z.string().min(2, "State is required"),
    country: z.string().min(3, "Country is required"),
    zipCode: z.string().min(3, "Zip code is required"),
  }),

  payment: z.object({
    cardNumber: z.string().regex(
      /^\d{16}$/,
      "Card number must be exactly 16 digits"
    ),
    holderName: z.string().min(1, "Holder name is required"),
    expiryDate: z.string().regex(
      /^(0[1-9]|1[0-2])\/\d{2}$/,
      "Expiry date must be MM/YY"
    ),
    cvv: z.string().regex(
      /^\d{3}$/,
      "CVV must be 3 digits"
    ),
  }),

  items: z.array(
    z.object({
      productId: z.uuid("Invalid product ID format"),
      quantity: z.number().int().min(1),
    })
  ).min(1),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;