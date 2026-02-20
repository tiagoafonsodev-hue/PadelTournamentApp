import * as Sentry from '@sentry/node';
import logger from './logger';

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        // Enable HTTP calls tracing
        Sentry.httpIntegration(),
      ],
      // Filter out health check endpoints from traces
      beforeSend(event) {
        if (event.request?.url?.includes('/health')) {
          return null;
        }
        return event;
      },
    });
    logger.info('Sentry initialized');
  } else {
    logger.info('Sentry DSN not configured, error tracking disabled');
  }
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  }
}

export { Sentry };
