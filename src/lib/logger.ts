/**
 * Structured logging utility
 * Provides environment-aware logging with security considerations
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (this.isProduction) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    const logEntry = this.formatLog('debug', message, context);
    console.debug('[DEBUG]', logEntry.message, logEntry.context || '');
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;

    const logEntry = this.formatLog('info', message, context);
    console.info('[INFO]', logEntry.message, logEntry.context || '');
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;

    const logEntry = this.formatLog('warn', message, context);
    console.warn('[WARN]', logEntry.message, logEntry.context || '');

    // In production, you might want to send to monitoring service
    if (this.isProduction) {
      this.sendToMonitoring('warn', logEntry);
    }
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const logEntry = this.formatLog('error', message, {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      }),
    });

    console.error('[ERROR]', logEntry.message, logEntry.context || '');

    // In production, send to monitoring service
    if (this.isProduction) {
      this.sendToMonitoring('error', logEntry);
    }
  }

  /**
   * Log security events
   */
  security(event: string, context?: LogContext): void {
    const logEntry = this.formatLog('warn', `[SECURITY] ${event}`, context);

    console.warn('[SECURITY]', logEntry.message, logEntry.context || '');

    // Always send security events to monitoring
    this.sendToMonitoring('security', logEntry);
  }

  /**
   * Log payment events (sensitive data handling)
   */
  payment(event: string, context?: LogContext): void {
    // Remove sensitive payment details
    const sanitizedContext = this.sanitizePaymentData(context);

    const logEntry = this.formatLog('info', `[PAYMENT] ${event}`, sanitizedContext);

    if (this.isDevelopment) {
      console.info('[PAYMENT]', logEntry.message, logEntry.context || '');
    }

    // In production, send to payment monitoring
    if (this.isProduction) {
      this.sendToMonitoring('payment', logEntry);
    }
  }

  /**
   * Remove sensitive data from logs
   */
  private sanitizePaymentData(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };

    // Remove sensitive fields
    const sensitiveFields = [
      'razorpay_key_secret',
      'razorpay_signature',
      'card_number',
      'cvv',
      'password',
      'token',
      'api_key',
      'secret',
    ];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Send logs to monitoring service (Sentry, Datadog, etc.)
   * Implement based on your monitoring provider
   */
  private sendToMonitoring(type: string, logEntry: LogEntry): void {
    // TODO: Implement monitoring service integration
    // Example: Sentry.captureMessage(logEntry.message, { level: logEntry.level, extra: logEntry.context });

    // For now, in production, ensure console logs are available
    if (this.isProduction && (type === 'error' || type === 'security')) {
      // These logs should always be visible in production
      console.error(`[${type.toUpperCase()}]`, logEntry);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, error?: Error | unknown, context?: LogContext) =>
  logger.error(message, error, context);
export const logSecurity = (event: string, context?: LogContext) => logger.security(event, context);
export const logPayment = (event: string, context?: LogContext) => logger.payment(event, context);

export default logger;
