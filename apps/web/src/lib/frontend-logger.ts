type FrontendLogLevel = 'debug' | 'info' | 'warn' | 'error';

type FrontendLogContext = Record<string, unknown>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CLIENT_LOGGING_ENABLED = process.env.NEXT_PUBLIC_CLIENT_LOGGING_ENABLED !== 'false';

function writeConsole(level: FrontendLogLevel, payload: Record<string, unknown>) {
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  if (level === 'info') {
    console.info(line);
    return;
  }
  console.debug(line);
}

function shipToApi(level: FrontendLogLevel, message: string, context?: FrontendLogContext) {
  if (typeof window === 'undefined' || !CLIENT_LOGGING_ENABLED) return;
  if (level !== 'warn' && level !== 'error') return;

  const body = JSON.stringify({
    level,
    message,
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
  });

  // Do not await - telemetry should never block UX.
  void fetch(`${API_URL}/api/client-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

function log(level: FrontendLogLevel, message: string, context?: FrontendLogContext) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    source: 'frontend',
    message,
    ...context,
  };
  writeConsole(level, payload);
  shipToApi(level, message, context);
}

export const frontendLogger = {
  debug(message: string, context?: FrontendLogContext) {
    log('debug', message, context);
  },
  info(message: string, context?: FrontendLogContext) {
    log('info', message, context);
  },
  warn(message: string, context?: FrontendLogContext) {
    log('warn', message, context);
  },
  error(message: string, context?: FrontendLogContext) {
    log('error', message, context);
  },
};
