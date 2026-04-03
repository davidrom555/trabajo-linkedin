import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';

interface ErrorLog {
  timestamp: Date;
  message: string;
  stack?: string;
  context?: string;
  userAgent: string;
}

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler implements ErrorHandler {
  private injector: Injector;
  private errorLogs: ErrorLog[] = [];
  private readonly MAX_LOGS = 50;

  constructor(injector: Injector) {
    this.injector = injector;
  }

  handleError(error: Error | any): void {
    const chunkFailedMessage = /Loading chunk \d+ failed/g.test(error.message);

    if (chunkFailedMessage) {
      // Handle lazy loading chunk failures
      this.handleChunkLoadingError();
    }

    const errorLog = this.createErrorLog(error);
    this.logError(errorLog);

    // Re-throw for browser console
    console.error('Global Error Handler:', error);
  }

  private handleChunkLoadingError(): void {
    // Auto-reload page on chunk loading failure
    // This handles lazy loading errors gracefully
    window.location.reload();
  }

  private createErrorLog(error: Error | any): ErrorLog {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : JSON.stringify(error);

    const stack =
      error instanceof Error ? error.stack : undefined;

    return {
      timestamp: new Date(),
      message,
      stack,
      context: this.getErrorContext(),
      userAgent: navigator.userAgent,
    };
  }

  private getErrorContext(): string {
    try {
      const router = this.injector.get(Router);
      return `Route: ${router.url}`;
    } catch {
      return 'Unknown context';
    }
  }

  private logError(log: ErrorLog): void {
    // Store locally for debugging
    this.errorLogs.push(log);

    // Keep only recent logs
    if (this.errorLogs.length > this.MAX_LOGS) {
      this.errorLogs = this.errorLogs.slice(-this.MAX_LOGS);
    }

    // Save to localStorage for persistence
    try {
      localStorage.setItem(
        'smartjob:error_logs',
        JSON.stringify(this.errorLogs)
      );
    } catch {
      // localStorage quota exceeded, clear old logs
      localStorage.removeItem('smartjob:error_logs');
    }

    // Send to remote monitoring (Sentry) if available
    this.sendToMonitoring(log);
  }

  private sendToMonitoring(log: ErrorLog): void {
    // Integration point for Sentry or similar service
    // This would be implemented when Sentry is added

    // Example:
    // if (window.Sentry) {
    //   Sentry.captureException(new Error(log.message), {
    //     tags: { context: log.context },
    //     extra: { stack: log.stack, userAgent: log.userAgent },
    //   });
    // }
  }

  // Utility methods for debugging
  getErrorLogs(): ErrorLog[] {
    return this.errorLogs;
  }

  clearErrorLogs(): void {
    this.errorLogs = [];
    localStorage.removeItem('smartjob:error_logs');
  }

  getErrorLogsJson(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }
}
