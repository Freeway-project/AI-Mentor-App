type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
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
  private betterStackSourceToken?: string;
  private betterStackIngestingUrl: string;
  private betterStackService: string;
  private betterStackEnvironment: string;
  private betterStackMinLevel: LogLevel;

  private readonly levelRank: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
  };

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';
    this.betterStackSourceToken = process.env.BETTERSTACK_SOURCE_TOKEN?.trim();
    this.betterStackIngestingUrl = (process.env.BETTERSTACK_INGESTING_URL || 'https://in.logs.betterstack.com').trim();
    this.betterStackService = process.env.BETTERSTACK_SERVICE?.trim() || 'owl-mentors-api';
    this.betterStackEnvironment = process.env.NODE_ENV || 'development';

    const configuredMinLevel = process.env.BETTERSTACK_MIN_LEVEL?.trim().toLowerCase() as LogLevel | undefined;
    this.betterStackMinLevel = configuredMinLevel && configuredMinLevel in this.levelRank
      ? configuredMinLevel
      : 'info';
  }

  private get isBetterStackEnabled(): boolean {
    return Boolean(this.betterStackSourceToken);
  }

  private shouldSendToBetterStack(level: LogLevel): boolean {
    return this.levelRank[level] >= this.levelRank[this.betterStackMinLevel];
  }

  private safeSerialize(value: unknown): string {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_key, currentValue) => {
      if (typeof currentValue === 'bigint') return currentValue.toString();
      if (typeof currentValue === 'object' && currentValue !== null) {
        if (seen.has(currentValue)) return '[Circular]';
        seen.add(currentValue);
      }
      return currentValue;
    });
  }

  private serializeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;
    try {
      return JSON.parse(this.safeSerialize(context)) as LogContext;
    } catch {
      return { serializationError: 'Failed to serialize log context' };
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    const serializedContext = this.serializeContext(context);

    if (this.isDev) {
      // Human-readable format for development
      const contextStr = serializedContext ? ` | ${this.safeSerialize(serializedContext)}` : '';
      return `[${timestamp}] ${levelUpper} ${message}${contextStr}`;
    } else {
      // JSON format for production
      return this.safeSerialize({
        timestamp,
        level,
        message,
        ...serializedContext,
      });
    }
  }

  private async sendToBetterStack(level: LogLevel, message: string, context?: LogContext): Promise<void> {
    if (!this.isBetterStackEnabled || !this.shouldSendToBetterStack(level)) return;

    const payload = {
      dt: new Date().toISOString(),
      level,
      message,
      service: this.betterStackService,
      environment: this.betterStackEnvironment,
      ...this.serializeContext(context),
    };

    try {
      const response = await fetch(this.betterStackIngestingUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.betterStackSourceToken}`,
          'Content-Type': 'application/json',
        },
        body: this.safeSerialize(payload),
      });

      if (!response.ok && this.isDev) {
        const errorText = await response.text();
        console.warn(
          `[Logger] Better Stack ingestion failed (${response.status}): ${errorText || response.statusText}`
        );
      }
    } catch (error) {
      if (this.isDev) {
        const err = error instanceof Error ? error.message : String(error);
        console.warn(`[Logger] Better Stack ingestion error: ${err}`);
      }
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

    // Fire-and-forget remote ingestion, never block request flow.
    void this.sendToBetterStack(level, message, context);
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

    const context = {
      type: 'request',
      requestId,
      method,
      path,
      query,
      userId,
      status,
      duration,
    };

    if (typeof status === 'number') {
      if (status >= 500) {
        this.error(message, undefined, context);
        return;
      }
      if (status >= 400) {
        this.warn(message, context);
        return;
      }
    }

    this.info(message, context);
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
