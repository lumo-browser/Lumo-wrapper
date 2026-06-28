import { describe, it, expect } from 'vitest';
import { validateUrl, checkDomMutation, checkClipboardWrite, checkWasmExecution } from '../securityDetector';

describe('Security Detector', () => {
  describe('validateUrl', () => {
    it('should flag known malicious zip domains', () => {
      const result = validateUrl('https://evil-payload.zip/file');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('block');
      expect(result.threat).toContain('Suspicious Domain Extension');
    });

    it('should flag known phishing patterns', () => {
      const result = validateUrl('https://login-verify-account.paypal-secure.click');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('block');
    });

    it('should pass safe domains', () => {
      const result = validateUrl('https://github.com/microsoft');
      expect(result.safe).toBe(true);
      expect(result.action).toBe('allow');
    });
  });

  describe('checkDomMutation', () => {
    it('should flag hidden iframes', () => {
      const result = checkDomMutation('<iframe style="display:none" src="http://evil.com"></iframe>');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('block');
    });

    it('should pass normal divs', () => {
      const result = checkDomMutation('<div class="app">Hello World</div>');
      expect(result.safe).toBe(true);
      expect(result.action).toBe('allow');
    });
  });

  describe('checkClipboardWrite', () => {
    it('should flag bitcoin addresses', () => {
      const result = checkClipboardWrite('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
      expect(result.safe).toBe(false);
      expect(result.action).toBe('block');
      expect(result.threat).toBe('Clipboard Hijack - Crypto Wallet Pattern Detected');
    });

    it('should pass normal text', () => {
      const result = checkClipboardWrite('Hello world this is just standard text');
      expect(result.safe).toBe(true);
      expect(result.action).toBe('allow');
    });
  });

  describe('checkWasmExecution', () => {
    it('should flag massive wasm payloads', () => {
      const result = checkWasmExecution(1500000); // 1.5MB
      expect(result.safe).toBe(false);
      expect(result.action).toBe('block');
      expect(result.threat).toBe('WebAssembly Cryptojacking - Payload Size Exceeds Safe Limit');
    });

    it('should pass small wasm payloads', () => {
      const result = checkWasmExecution(500000); // 500KB
      expect(result.safe).toBe(true);
      expect(result.action).toBe('allow');
    });
  });
});
