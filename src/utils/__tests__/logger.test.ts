/**
 * Tests for Logger utility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Logger, LogLevel } from '@utils/logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance();
    logger.clearLogs();
  });

  it('should create a singleton instance', () => {
    const instance1 = Logger.getInstance();
    const instance2 = Logger.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should log messages at different levels', () => {
    logger.trace('test', 'trace message');
    logger.debug('test', 'debug message');
    logger.info('test', 'info message');
    logger.warn('test', 'warn message');
    logger.error('test', 'error message');

    const logs = logger.getLogs();
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should filter logs by level', () => {
    logger.info('test', 'info');
    logger.warn('test', 'warn');
    logger.error('test', 'error');

    const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
    expect(errorLogs.some((log) => log.message === 'error')).toBe(true);
  });

  it('should filter logs by scope', () => {
    logger.info('scope1', 'message 1');
    logger.info('scope2', 'message 2');
    logger.info('scope1', 'message 3');

    const scope1Logs = logger.getLogsByScope('scope1');
    expect(scope1Logs.length).toBe(2);
  });

  it('should include error data when logging errors', () => {
    const error = new Error('Test error');
    logger.error('test', 'error occurred', error);

    const logs = logger.getLogs();
    const errorLog = logs[logs.length - 1];
    expect(errorLog.error).toContain('Test error');
  });

  it('should export logs as JSON', () => {
    logger.info('test', 'export test');
    const exported = logger.exportLogs();
    expect(exported).toBeTruthy();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('should clear logs', () => {
    logger.info('test', 'message');
    expect(logger.getLogs().length).toBeGreaterThan(0);
    logger.clearLogs();
    expect(logger.getLogs().length).toBe(0);
  });
});
