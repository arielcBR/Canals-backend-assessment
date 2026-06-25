/**
 * Erro padronizado da aplicação.
 *
 * Usado para retornar erros controlados com:
 * - código HTTP
 * - mensagem amigável
 * - código semântico interno (para frontend/debug)
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = "APP_ERROR") {
    super(message);

    this.statusCode = statusCode;
    this.code = code;

    // garante stack trace correta (importante em Node)
    Error.captureStackTrace(this, this.constructor);
  }
}