/**
 * Logger utility for Lumo Browser
 * Provides structured logging with levels and formatting
 */

import { LogLevel, LOG_LEVEL } from '../core/constants';

export { LogLevel };

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, scope: string, message: string, data?: unknown): void {
    const levelValue = Object.values(LogLevel).indexOf(level);
    const currentLevelValue = Object.values(LogLevel).indexOf(LOG_LEVEL);

    if (levelValue < currentLevelValue) {
      return; // Skip logs below configured level
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      scope,
      message,
      data: data && typeof data === 'object' ? (data as Record<string, unknown>) : { value: data },
    };

    // Add error message if data is an Error
    if (data instanceof Error) {
      entry.error = data.message;
      entry.data = { stack: data.stack };
    }

    this.logs.push(entry);

    // Keep logs array bounded
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      this.logToConsole(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.scope}]`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.data || '', entry.error || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(prefix, entry.message, entry.data || '');
        break;
    }
  }

  trace(scope: string, message: string, data?: unknown): void {
    this.log(LogLevel.TRACE, scope, message, data);
  }

  debug(scope: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, scope, message, data);
  }

  info(scope: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, scope, message, data);
  }

  warn(scope: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, scope, message, data);
  }

  error(scope: string, message: string, error?: Error | unknown): void {
    this.log(LogLevel.ERROR, scope, message, error);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  getLogsByScope(scope: string): LogEntry[] {
    return this.logs.filter((log) => log.scope.includes(scope));
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = Logger.getInstance();
