import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppLoggerService {
  error(context: string, error: unknown): void {
    const payload = {
      context,
      timestamp: new Date().toISOString(),
      error: this.serializeError(error)
    };

    // Keep the latest frontend error available for diagnostics.
    sessionStorage.setItem('carehub_last_frontend_error', JSON.stringify(payload));
  }

  private serializeError(error: unknown): Record<string, unknown> | string {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.parse(JSON.stringify(error)) as Record<string, unknown>;
      } catch {
        return 'Unserializable error object';
      }
    }

    return String(error);
  }
}
