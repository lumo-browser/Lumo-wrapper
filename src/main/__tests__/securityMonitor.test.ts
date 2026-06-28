import { describe, it, expect, vi, beforeEach } from 'vitest';
import { monitorNetworkRequests } from '../securityMonitor';

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
    monitorNetworkRequests(mockSession as any, mockWindow as any);
    expect(mockSession.webRequest.onBeforeRequest).toHaveBeenCalled();
  });
});
