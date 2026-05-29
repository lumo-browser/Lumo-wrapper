/**
 * Core error definitions for Nova Browser
 */

export class NovaBrowserError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NovaBrowserError';
    Object.setPrototypeOf(this, NovaBrowserError.prototype);
  }
}

export class ValidationError extends NovaBrowserError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends NovaBrowserError {
  constructor(message: string = 'Authentication failed') {
    super('AUTHENTICATION_ERROR', message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class PermissionDeniedError extends NovaBrowserError {
  constructor(message: string = 'Permission denied') {
    super('PERMISSION_DENIED', message);
    this.name = 'PermissionDeniedError';
    Object.setPrototypeOf(this, PermissionDeniedError.prototype);
  }
}

export class AutomationError extends NovaBrowserError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('AUTOMATION_ERROR', message, details);
    this.name = 'AutomationError';
    Object.setPrototypeOf(this, AutomationError.prototype);
  }
}

export class PageNotFoundError extends NovaBrowserError {
  constructor(message: string = 'Page not found') {
    super('PAGE_NOT_FOUND', message);
    this.name = 'PageNotFoundError';
    Object.setPrototypeOf(this, PageNotFoundError.prototype);
  }
}

export class DatabaseError extends NovaBrowserError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('DATABASE_ERROR', message, details);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class APIError extends NovaBrowserError {
  constructor(
    public statusCode: number,
    message: string,
    details?: Record<string, unknown>
  ) {
    super('API_ERROR', message, details);
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class TimeoutError extends NovaBrowserError {
  constructor(message: string = 'Operation timed out') {
    super('TIMEOUT_ERROR', message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
