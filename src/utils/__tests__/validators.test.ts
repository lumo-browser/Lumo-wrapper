/**
 * Tests for Validator utility
 */

import { describe, it, expect } from 'vitest';
import { Validator, Sanitizer } from '@utils/validators';
import { ValidationError } from '@core/errors';

describe('Validator', () => {
  describe('isValidURL', () => {
    it('should validate correct URLs', () => {
      expect(Validator.isValidURL('https://example.com')).toBe(true);
      expect(Validator.isValidURL('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(Validator.isValidURL('not a url')).toBe(false);
      expect(Validator.isValidURL('htp://example')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(Validator.isValidEmail('test@example.com')).toBe(true);
      expect(Validator.isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(Validator.isValidEmail('invalid')).toBe(false);
      expect(Validator.isValidEmail('user@')).toBe(false);
    });
  });

  describe('validateString', () => {
    it('should validate string parameters', () => {
      expect(() => Validator.validateString('hello', 'name')).not.toThrow();
    });

    it('should throw on non-string values', () => {
      expect(() => Validator.validateString(123, 'value')).toThrow(ValidationError);
    });

    it('should check minimum length', () => {
      expect(() => Validator.validateString('hi', 'value', 3)).toThrow(ValidationError);
    });

    it('should check maximum length', () => {
      expect(() => Validator.validateString('hello', 'value', 1, 3)).toThrow(ValidationError);
    });
  });

  describe('validateNumber', () => {
    it('should validate numbers', () => {
      expect(() => Validator.validateNumber(42, 'value')).not.toThrow();
    });

    it('should throw on non-number values', () => {
      expect(() => Validator.validateNumber('42', 'value')).toThrow(ValidationError);
    });

    it('should check minimum value', () => {
      expect(() => Validator.validateNumber(5, 'value', 10)).toThrow(ValidationError);
    });

    it('should check maximum value', () => {
      expect(() => Validator.validateNumber(15, 'value', 0, 10)).toThrow(ValidationError);
    });
  });

  describe('validateEnum', () => {
    it('should validate enum values', () => {
      expect(() =>
        Validator.validateEnum('active', 'status', ['active', 'inactive', 'pending'])
      ).not.toThrow();
    });

    it('should throw on invalid enum values', () => {
      expect(() =>
        Validator.validateEnum('invalid', 'status', ['active', 'inactive'])
      ).toThrow(ValidationError);
    });
  });
});

describe('Sanitizer', () => {
  describe('sanitizeHTML', () => {
    it('should escape HTML entities', () => {
      const result = Sanitizer.sanitizeHTML('<script>alert("XSS")</script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should escape quotes', () => {
      const result = Sanitizer.sanitizeHTML('He said "Hello"');
      expect(result).toContain('&quot;');
    });
  });

  describe('sanitizeUserPrompt', () => {
    it('should sanitize user input', () => {
      const prompt = 'Find me the best laptop; rm -rf /';
      const result = Sanitizer.sanitizeUserPrompt(prompt);
      expect(result).not.toContain(';');
      expect(result).not.toContain('rm -rf');
    });

    it('should remove excessive whitespace', () => {
      const prompt = 'Find    me    the    best    laptop';
      const result = Sanitizer.sanitizeUserPrompt(prompt);
      expect(result).toBe('Find me the best laptop');
    });

    it('should limit length', () => {
      const longPrompt = 'a'.repeat(3000);
      const result = Sanitizer.sanitizeUserPrompt(longPrompt);
      expect(result.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('sanitizeSelector', () => {
    it('should remove dangerous characters', () => {
      const selector = 'div.class`${alert()}`';
      const result = Sanitizer.sanitizeSelector(selector);
      expect(result).not.toContain('`');
      expect(result).not.toContain('$');
    });
  });
});
