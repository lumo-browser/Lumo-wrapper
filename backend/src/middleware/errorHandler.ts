import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface ApiError extends Error {
  status?: number;
  code?: string;
}

class AppError extends Error implements ApiError {
  status: number;
  code: string;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const errorHandler = (
  error: ApiError | Error,
  req: Request,
  _res: Response,
  _next: NextFunction
): void => {
  const appError = error instanceof AppError
    ? error
    : new AppError(
        error.message || 'An unexpected error occurred',
        500,
        'INTERNAL_ERROR'
      );

  logger.error(`Error [${req.method} ${req.path}]:`, {
    status: appError.status,
    code: appError.code,
    message: appError.message,
  });

  _res.status(appError.status).json({
    error: {
      message: appError.message,
      code: appError.code,
      status: appError.status,
      timestamp: new Date().toISOString(),
    },
  });
};

export { AppError, errorHandler as default };
