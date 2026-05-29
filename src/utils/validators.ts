/**
 * Input validation utilities for security
 */

import { ValidationError } from '@core/errors';

export class Validator {
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidSelector(selector: string): boolean {
    try {
      // Test if selector is valid CSS
      document.querySelectorAll(selector);
      return true;
    } catch {
      return false;
    }
  }

  static isNonEmptyString(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  static isPositiveNumber(value: unknown): boolean {
    return typeof value === 'number' && value > 0 && !isNaN(value);
  }

  static isValidJSON(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static validateRequired(value: unknown, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`);
    }
  }

  static validateString(value: unknown, fieldName: string, minLength = 1, maxLength = Infinity): void {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, { fieldName, type: typeof value });
    }

    if (value.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, {
        fieldName,
        minLength,
        actual: value.length,
      });
    }

    if (value.length > maxLength) {
      throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`, {
        fieldName,
        maxLength,
        actual: value.length,
      });
    }
  }

  static validateNumber(
    value: unknown,
    fieldName: string,
    min?: number,
    max?: number
  ): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a number`, { fieldName, type: typeof value });
    }

    if (min !== undefined && value < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`, {
        fieldName,
        min,
        actual: value,
      });
    }

    if (max !== undefined && value > max) {
      throw new ValidationError(`${fieldName} must not exceed ${max}`, {
        fieldName,
        max,
        actual: value,
      });
    }
  }

  static validateURL(value: unknown, fieldName: string): void {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, { fieldName });
    }

    if (!this.isValidURL(value)) {
      throw new ValidationError(`${fieldName} is not a valid URL`, { fieldName, value });
    }
  }

  static validateEmail(value: unknown, fieldName: string): void {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, { fieldName });
    }

    if (!this.isValidEmail(value)) {
      throw new ValidationError(`${fieldName} is not a valid email`, { fieldName, value });
    }
  }

  static validateEnum(
    value: unknown,
    fieldName: string,
    allowedValues: readonly string[] | readonly number[]
  ): void {
    if (!allowedValues.includes(value as never)) {
      throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, {
        fieldName,
        allowedValues,
        actual: value,
      });
    }
  }

  static validateArray(value: unknown, fieldName: string, itemType?: string): void {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`, {
        fieldName,
        type: typeof value,
      });
    }

    if (itemType && !value.every((item) => typeof item === itemType)) {
      throw new ValidationError(`${fieldName} items must all be of type ${itemType}`, {
        fieldName,
        itemType,
      });
    }
  }
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export class Sanitizer {
  private static readonly HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  static sanitizeHTML(value: string): string {
    return value.replace(/[&<>"'/]/g, (char) => this.HTML_ENTITIES[char] ?? char);
  }

  static sanitizeUserPrompt(prompt: string): string {
    // Remove potentially dangerous patterns while preserving intent
    let sanitized = prompt.trim();

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Remove shell-like commands
    sanitized = sanitized
      .replace(/[`$(){}[\]|&;]/g, '')
      .trim();

    // Limit length
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000).trim();
    }

    return sanitized;
  }

  static sanitizeSelector(selector: string): string {
    // Allow only CSS selector characters, no JavaScript
    return selector.replace(/[`$(){}|&;]/g, '').trim();
  }

  static sanitizeSQL(value: string): string {
    // Note: Parameterized queries should be used in actual SQL
    // This is a fallback for logging/display only
    return value.replace(/['";\\]/g, (char) => `\\${char}`);
  }
}
