import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("[error]", err);

  const status  = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? "Internal server error";
  const code    = err.code ?? "INTERNAL_ERROR";

  res.status(status).json({ error: code, message });
}
