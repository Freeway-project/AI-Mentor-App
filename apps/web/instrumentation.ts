/**
 * Next.js instrumentation hook — runs once on server startup.
 * Vercel picks this up automatically for OpenTelemetry tracing and
 * error reporting in the Observability dashboard.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Server-side only initialisation
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Vercel Observability injects its own OTel exporter at the platform
    // level — no extra SDK needed for basic traces/logs on Vercel.
    // Add any third-party APM init (e.g. Sentry, Datadog) here if required.
  }
}

/**
 * Called by Next.js for every unhandled request error.
 * Structured log is captured by Vercel Log Drains / Observability.
 */
export async function onRequestError(
  err: unknown,
  request: { url: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  // Structured JSON — visible in Vercel Logs and any connected log drain
  console.error(
    JSON.stringify({
      level: 'error',
      source: 'nextjs-request',
      message,
      stack,
      url: request.url,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
      timestamp: new Date().toISOString(),
    })
  );
}
