type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface RequestLogData {
  requestId?: string;
  method: string;
  path: string;
  query?: any;
  userId?: string;
  status?: number;
  duration?: number;
}

interface DbLogData {
  operation: string;
  collection: string;
  duration?: number;
  error?: string;
}

interface LlmLogData {
  provider: string;
  model?: string;
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  duration?: number;
  error?: string;
}

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);

    if (this.isDev) {
      // Human-readable format for development
      const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
      return `[${timestamp}] ${levelUpper} ${message}${contextStr}`;
    } else {
      // JSON format for production
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...context,
      });
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const formatted = this.formatMessage(level, message, context);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | string, context?: LogContext): void {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (typeof error === 'string') {
      errorContext.error = error;
    }

    this.log('error', message, errorContext);
  }

  // Specialized logging methods
  request(data: RequestLogData): void {
    const { requestId, method, path, query, userId, status, duration } = data;

    const message = status
      ? `${method} ${path} ${status} ${duration}ms`
      : `${method} ${path}`;

    this.info(message, {
      type: 'request',
      requestId,
      method,
      path,
      query,
      userId,
      status,
      duration,
    });
  }

  db(data: DbLogData): void {
    const { operation, collection, duration, error } = data;

    if (error) {
      this.error(`DB ${operation} failed on ${collection}`, error, {
        type: 'database',
        operation,
        collection,
        duration,
      });
    } else {
      const message = duration
        ? `DB ${operation} on ${collection} (${duration}ms)`
        : `DB ${operation} on ${collection}`;

      this.debug(message, {
        type: 'database',
        operation,
        collection,
        duration,
      });
    }
  }

  llm(data: LlmLogData): void {
    const { provider, model, tokens, duration, error } = data;

    if (error) {
      this.error(`LLM call failed (${provider})`, error, {
        type: 'llm',
        provider,
        model,
        duration,
      });
    } else {
      const message = `LLM call (${provider}${model ? `/${model}` : ''})${duration ? ` ${duration}ms` : ''}`;

      this.info(message, {
        type: 'llm',
        provider,
        model,
        tokens,
        duration,
      });
    }
  }
}

export const logger = new Logger();
