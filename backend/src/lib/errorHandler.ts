import { Response } from 'express';
import logger from './logger';

interface ErrorContext {
  [key: string]: any;
}

/**
 * Generate a unique error ID for tracking
 */
export function generateErrorId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Handle and log errors with context, return user-friendly response
 */
export function handleError(
  res: Response,
  error: unknown,
  operation: string,
  context: ErrorContext = {}
): void {
  const errorId = generateErrorId();

  logger.error(`${operation} failed`, {
    errorId,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });

  res.status(500).json({
    error: `Failed to ${operation.toLowerCase()}`,
    errorId,
  });
}

/**
 * Handle validation errors (400)
 */
export function handleValidationError(
  res: Response,
  message: string,
  details?: any
): void {
  res.status(400).json({
    error: message,
    details,
  });
}

/**
 * Handle not found errors (404)
 */
export function handleNotFoundError(
  res: Response,
  resource: string
): void {
  res.status(404).json({
    error: `${resource} not found`,
  });
}
