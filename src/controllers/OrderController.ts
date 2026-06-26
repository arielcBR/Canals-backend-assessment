import type { Request, Response, NextFunction } from "express";
import { createOrderSchema } from "../schemas/createOrderSchema";
import { OrderService } from "../services/order.service";

export class OrderController {
  private orderService = new OrderService();
  

  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {

    try {
      const result = createOrderSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request payload",
            details: result.error.flatten().fieldErrors,
          },
        });

        return;
      }
    
      const order = await this.orderService.create(result.data);

      res.status(201).json({
        message: "Order created succesfully!",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };
}