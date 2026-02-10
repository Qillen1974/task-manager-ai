export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
};

function parseLogLevel(level: string): LogLevel {
  switch (level.toUpperCase()) {
    case "DEBUG": return LogLevel.DEBUG;
    case "WARN": return LogLevel.WARN;
    case "ERROR": return LogLevel.ERROR;
    default: return LogLevel.INFO;
  }
}

const globalThreshold = parseLogLevel(process.env.LOG_LEVEL || "INFO");

export class Logger {
  constructor(private component: string) {}

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    if (level < globalThreshold) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: LEVEL_NAMES[level],
      component: this.component,
      message,
      ...(data ? { data } : {}),
    };

    process.stdout.write(JSON.stringify(entry) + "\n");
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, data);
  }
}

export function createLogger(component: string): Logger {
  return new Logger(component);
}
