import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachSecurityMonitor } from '../securityMonitor';

// Mock Electron session
const mockSession = {
  webRequest: {
    onBeforeRequest: vi.fn(),
    onBeforeSendHeaders: vi.fn(),
  },
};

const mockWindow = {
  webContents: {
    send: vi.fn(),
  }
};

describe('Security Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should attach to onBeforeRequest', () => {
    attachSecurityMonitor(mockSession as any, mockWindow as any);
    expect(mockSession.webRequest.onBeforeRequest).toHaveBeenCalled();
  });

  it('should attach to onBeforeSendHeaders', () => {
    attachSecurityMonitor(mockSession as any, mockWindow as any);
    expect(mockSession.webRequest.onBeforeSendHeaders).toHaveBeenCalled();
  });
});
