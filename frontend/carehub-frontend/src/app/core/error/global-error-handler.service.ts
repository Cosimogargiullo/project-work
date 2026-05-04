import { ErrorHandler, Injectable } from '@angular/core';
import { AppLoggerService } from './app-logger.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  constructor(private logger: AppLoggerService) {}

  handleError(error: unknown): void {
    this.logger.error('GlobalErrorHandler', error);
  }
}
