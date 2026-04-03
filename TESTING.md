# Testing & Stability Guide

## Overview

This document outlines the testing infrastructure and error handling strategies implemented in SmartJob Agent.

## Testing Framework

### Setup

- **Framework**: Vitest (faster than Jest for Angular projects)
- **Environment**: JSDOM
- **Coverage Target**: 80% for core services

### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests with UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage

# CI/CD test run (no watch mode)
npm run test:ci
```

## Test Suites

### 1. JobService Tests (`job.service.spec.ts`)

**Coverage**: 30+ test cases covering:

- ✅ Initialization and default filters
- ✅ Filter operations (search, time, remote, salary, location, sources)
- ✅ Job operations (toggle saved, mark applied, dismiss)
- ✅ Matching algorithm (score calculation, breakdown)
- ✅ Filtering logic (single and combined filters)
- ✅ Statistics calculation
- ✅ Error handling
- ✅ LocalStorage persistence

**Key Test Cases**:
```typescript
✓ should calculate match score for job with profile
✓ should filter by remote only
✓ should combine multiple filters
✓ should calculate correct total count
```

### 2. CvParserService Tests (`cv-parser.service.spec.ts`)

**Coverage**: 35+ test cases covering:

- ✅ Email extraction (valid, with numbers, invalid)
- ✅ Phone number extraction (international, formats)
- ✅ Name extraction (patterns, capitalization, all-caps)
- ✅ Skill detection (languages, frameworks, case-insensitive, no duplicates)
- ✅ Location extraction (known cities, fallback)
- ✅ Language detection (Español, Inglés, fallback)
- ✅ Summary extraction (multiple patterns, minimum length)
- ✅ Text cleaning (whitespace, encoding)
- ✅ Full profile parsing
- ✅ Error handling (empty text, missing fields)

**Key Test Cases**:
```typescript
✓ should extract email with numbers
✓ should detect multiple frameworks
✓ should handle case insensitive matching
✓ should not duplicate skills
✓ should set default summary when not found
```

## Error Handling

### GlobalErrorHandler

**Location**: `src/app/core/error-handler.ts`

Centralized error handling for the entire application:

#### Features:

1. **Error Logging**
   - Captures client-side errors
   - Stores up to 50 error logs in memory
   - Persists to localStorage for debugging
   - Includes timestamp, message, stack, context, user agent

2. **Chunk Loading Failures**
   - Auto-reloads page on lazy loading failures
   - Prevents user from seeing broken application

3. **Error Context**
   - Automatically captures current route
   - Useful for debugging route-specific issues

4. **Remote Monitoring Ready**
   - Prepared for Sentry integration
   - Logs ready to send to analytics service

#### Usage:

```typescript
// Errors are automatically caught globally
// No need for explicit error handling in most cases

// Access error logs (for debugging):
const errorHandler = inject(GlobalErrorHandler);
const logs = errorHandler.getErrorLogs();
const logsJson = errorHandler.getErrorLogsJson();

// Clear logs:
errorHandler.clearErrorLogs();
```

### Error Interceptor

**Location**: `src/app/core/error.interceptor.ts`

Handles HTTP errors globally:

#### Features:

1. **Automatic Retry**
   - Retries failed requests 2 times
   - Exponential backoff (1 second per retry)
   - Only retries on 5xx errors
   - Skips retry on client errors (4xx)

2. **User-Friendly Error Messages**
   - 0: Network error
   - 400: Bad request
   - 401: Unauthorized
   - 403: Access denied
   - 404: Not found
   - 429: Rate limit
   - 500+: Server error

3. **Error Logging**
   - Logs HTTP errors to browser console
   - Includes URL, status, and context

#### Usage:

```typescript
// Errors are intercepted automatically
// Example in component:
try {
  const data = await this.jobService.loadJobs();
} catch (error) {
  // Error already logged by interceptor
  // Message is user-friendly
  this.toastController.create({
    message: error.message, // "Network error. Check..."
    color: 'danger'
  });
}
```

## Integration in AppConfig

Both error handlers are registered globally in `src/app/app.config.ts`:

```typescript
providers: [
  // ... other providers
  { provide: ErrorHandler, useClass: GlobalErrorHandler },
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
]
```

## Error Monitoring (Sentry Setup - Optional)

To integrate with Sentry for production monitoring:

```bash
npm install @sentry/angular @sentry/tracing
```

Then add to `src/main.ts`:

```typescript
import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.Replay()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
```

And uncomment in `error-handler.ts`:

```typescript
private sendToMonitoring(log: ErrorLog): void {
  if (window.Sentry) {
    Sentry.captureException(new Error(log.message), {
      tags: { context: log.context },
      extra: { stack: log.stack, userAgent: log.userAgent },
    });
  }
}
```

## Best Practices

### Writing Tests

1. **Use descriptive test names**
   ```typescript
   it('should calculate match score for job with profile', () => {
     // Test code
   });
   ```

2. **Arrange-Act-Assert pattern**
   ```typescript
   // Arrange: setup
   const job = mockJob;
   
   // Act: execute
   service.toggleSaved(job.id);
   
   // Assert: verify
   expect(service.jobs()[0].saved).toBe(true);
   ```

3. **Test edge cases**
   ```typescript
   it('should handle empty text gracefully', () => {
     const profile = service.parseText('', 'empty.txt');
     expect(profile).toBeTruthy();
   });
   ```

### Error Handling

1. **Catch errors at system boundaries**
   - HTTP requests
   - File operations
   - User input

2. **Log with context**
   ```typescript
   catch (error) {
     console.error('Loading jobs failed at', new Date(), error);
   }
   ```

3. **Show user-friendly messages**
   ```typescript
   catch (error) {
     this.showToast(
       'Unable to load jobs. Please try again later.',
       'danger'
     );
   }
   ```

## Coverage Goals

```
Target: 80% overall coverage

Services (Core):
  - JobService: 85%
  - CvParserService: 80%
  - ProfileService: 75%

Components:
  - Test critical components only
  - Focus on business logic, not styling

Target Coverage by Area:
  - Lines: 80%
  - Functions: 80%
  - Branches: 75%
  - Statements: 80%
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v2
```

## Debugging Tips

1. **View error logs in DevTools console**
   ```javascript
   // In browser console:
   localStorage.getItem('smartjob:error_logs')
   ```

2. **Enable detailed logging**
   ```typescript
   // In error-handler.ts, uncomment:
   console.log('Error Log', log);
   ```

3. **Test specific file**
   ```bash
   npm test -- job.service.spec.ts
   ```

4. **Debug single test**
   ```bash
   npm test -- --inspect-brk job.service.spec.ts
   ```

## Common Issues

### Issue: Tests timeout
**Solution**: Increase timeout in vitest.config.ts
```typescript
test: {
  testTimeout: 10000, // 10 seconds
}
```

### Issue: Module not found
**Solution**: Check tsconfig paths are correct
```typescript
"paths": {
  "@": ["src"],
}
```

### Issue: Async tests hanging
**Solution**: Always return promise or use `async`/`await`
```typescript
it('should load jobs', async () => {
  await service.loadJobs();
  expect(service.jobs()).toBeTruthy();
});
```

## Next Steps

1. ✅ Basic test suite setup (DONE)
2. ⬜ Component tests for critical features
3. ⬜ E2E tests with Cypress/Playwright
4. ⬜ Performance testing
5. ⬜ Accessibility testing
6. ⬜ Sentry integration for production

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Sentry Documentation](https://docs.sentry.io/)
