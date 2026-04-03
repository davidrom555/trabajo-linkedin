import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { of } from 'rxjs';

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly retryConfig: RetryConfig = {
    maxRetries: 2,
    delayMs: 1000,
    backoffMultiplier: 2,
  };

  // Request URLs that should not be retried
  private readonly noRetryPatterns = ['/auth', '/login', '/signup'];

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const shouldRetry = !this.noRetryPatterns.some((pattern) =>
      req.url.includes(pattern)
    );

    const retries = shouldRetry ? this.retryConfig.maxRetries : 0;

    return next.handle(req).pipe(
      retry({
        count: retries,
        delay: (error: HttpErrorResponse) => {
          return this.calculateDelay(error);
        },
      }),
      catchError((error: HttpErrorResponse) => {
        return this.handleError(error, req);
      })
    );
  }

  private calculateDelay(error: HttpErrorResponse): Observable<void> {
    // Don't retry on 4xx client errors
    if (error.status >= 400 && error.status < 500) {
      return throwError(() => error);
    }

    // Exponential backoff for retries
    const delayMs = this.retryConfig.delayMs;
    return new Observable<void>((observer) => {
      const timeout = setTimeout(() => {
        observer.next();
        observer.complete();
      }, delayMs);

      return () => clearTimeout(timeout);
    });
  }

  private handleError(
    error: HttpErrorResponse,
    req: HttpRequest<any>
  ): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Network error. Check your internet connection.';
          break;
        case 400:
          errorMessage = 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Access denied.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service unavailable. Please try again later.';
          break;
        default:
          errorMessage = `Error: ${error.status} - ${error.statusText}`;
      }
    }

    console.error('HTTP Error:', {
      status: error.status,
      message: error.message,
      url: req.url,
      errorMessage,
    });

    // Return error with user-friendly message
    const errorWithMessage = new Error(errorMessage);
    (errorWithMessage as any).originalError = error;

    return throwError(() => errorWithMessage);
  }
}
