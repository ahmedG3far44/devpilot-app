import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
  });
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof z.ZodError) {
    statusCode = 400;
    message = "Invalid request data";
    const details = err.flatten();
    res.status(statusCode).json({
      success: false,
      error: message,
      details,
      fieldErrors: details.fieldErrors,
    });
    return;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    const validationErrors = (err as { errors?: Record<string, { message: string }> }).errors;
    message = validationErrors
      ? Object.values(validationErrors)
          .map((fieldErr) => fieldErr.message)
          .join(", ")
      : "Validation Error";
  } else if (err.name === "CastError") {
    statusCode = 400;
    const castErr = err as { path?: string; value?: unknown };
    message = `Invalid value for "${castErr.path}"`;
  } else if ((err as { code?: number }).code === 11000) {
    statusCode = 409;
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue || {};
    const field = Object.keys(keyValue)[0];
    message = `A record with this ${field || "value"} already exists`;
  } else if (err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = "Session expired. Please sign in again";
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid authentication token";
  } else if (statusCode === 500) {
    const isDev = process.env.NODE_ENV === "development";
    message = isDev && err.message ? err.message : "Internal Server Error";
  }

  console.error(`[${statusCode}] ${req.method} ${req.originalUrl} - ${err.message}`);

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
