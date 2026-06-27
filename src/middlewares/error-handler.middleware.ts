import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code:    error.code,
        message: error.message,
      },
    });
    return;
  }

  console.error("[Unhandled Error]", error);

  res.status(500).json({
    error: {
      code:    "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
}