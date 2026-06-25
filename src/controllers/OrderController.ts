import type { Request, Response, NextFunction } from "express";
import { z } from 'zod';

const createOrderSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID format"), // <-- Validando apenas o ID

  shippingAddress: z.object({
    street: z.string().min(1, "Street is required"),
    number: z.string().min(1, "Number is required"), // Adicionado do seu DTO
    complement: z.string().optional(), // Adicionado do seu DTO
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    zipCode: z.string().min(1, "Zip code is required"),
  }),

  // Atualizado para bater com o seu DTO
  payment: z.object({
    cardNumber: z.string().regex(/^\d{16}$/, "Card number must be exactly 16 digits"),
    holderName: z.string().min(1, "Holder name is required"),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must be MM/YY"),
    cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
  }),

  // Removido o unitPrice daqui, pois como conversamos, buscaremos no banco!
  items: z.array(
    z.object({
      productId: z.string().uuid("Invalid product ID format"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })
  ).min(1, "Order must contain at least one item"),
});

export class OrderController {
  // Usar arrow function (create = async ...) garante que o 'this' interna do Express 
  // não se perca na rota sem precisar de um .bind(this)
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Valida o corpo da requisição contra o schema do Zod
      const validatedData = createOrderSchema.parse(req.body);

      // FASE 4/5: Aqui chamaremos o service futuramente:
      // const order = await this.orderService.execute(validatedData);
      
      console.log("Dados validados com sucesso:", validatedData);

      // Retorno temporário para você testar na sua rota
      res.status(201).json({ 
        message: "Order data validated! Ready for service layer.",
        data: validatedData 
      });
    } catch (error) {
      // Se o erro for do Zod, interceptamos e mandamos um 400 limpo
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request payload",
            details: error.flatten().fieldErrors
          }
        });
        return;
      }

      // Passa qualquer outro erro inesperado para o middleware global de erro (Task 1.3)
      next(error);
    }
  };
}

// Exporta a instância pronta para ser usada nas rotas
export const orderController = new OrderController();