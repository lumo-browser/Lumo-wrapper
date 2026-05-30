enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private logLevel: LogLevel;

  constructor(level: string = process.env.LOG_LEVEL || 'INFO') {
    this.logLevel = (LogLevel as any)[level.toUpperCase()] || LogLevel.INFO;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (data) {
      (entry as any).data = data;
    }

    console.log(JSON.stringify(entry));
  }

  debug(message: string, data?: unknown): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.log(LogLevel.DEBUG, message, data);
    }
  }

  info(message: string, data?: unknown): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.log(LogLevel.INFO, message, data);
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.log(LogLevel.WARN, message, data);
    }
  }

  error(message: string, data?: unknown): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.log(LogLevel.ERROR, message, data);
    }
  }
}

export const logger = new Logger();
