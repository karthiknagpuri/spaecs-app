/**
 * Error handling utilities for consistent error responses
 */

import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Log error with proper context (without exposing sensitive data)
 */
export function logError(error: any, context: string) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode
  };

  // Log to console (in production, this would go to a logging service)
  console.error(`[${context}] Error:`, errorInfo);

  // In production, send to error tracking service
  // e.g., Sentry, LogRocket, DataDog
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement error tracking service integration
  }
}

/**
 * Create safe error response for client
 */
export function createErrorResponse(error: any, context: string = 'API'): NextResponse {
  // Log the error
  logError(error, context);

  // Handle known error types
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && error.field ? { field: error.field } : {})
      },
      { status: error.statusCode }
    );
  }

  // Handle database errors (don't expose details)
  if (error.code?.startsWith('PGRST')) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Resource not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Database error occurred', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  // Handle Supabase auth errors
  if (error.message?.includes('JWT') || error.message?.includes('token')) {
    return NextResponse.json(
      { error: 'Authentication failed', code: 'AUTH_ERROR' },
      { status: 401 }
    );
  }

  // Generic error (don't expose internal details)
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  );
}

/**
 * Sanitize error message for logging (remove sensitive data)
 */
export function sanitizeErrorForLogging(error: any): any {
  const sanitized = { ...error };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
    'session'
  ];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}
