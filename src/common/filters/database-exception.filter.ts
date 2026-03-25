import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const rawError = exception as unknown as {
      code: string;
      detail?: string;
    };
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (rawError.code) {
      case '23505':
        statusCode = HttpStatus.CONFLICT;
        message = this.extractUniqueViolationMessage(rawError.detail);
        break;
      case '23503':
        statusCode = HttpStatus.NOT_FOUND;
        message = 'Related resource not found';
        break;
    }

    response.status(statusCode).json({
      statusCode,
      message,
    });
  }

  private extractUniqueViolationMessage(detail?: string): string {
    if (!detail) return 'Unique constraint violation';

    const separatorIndex = detail.indexOf(')=(');
    if (detail.startsWith('(') && separatorIndex > 1 && detail.endsWith(')')) {
      const field = detail.slice(1, separatorIndex);
      const value = detail.slice(separatorIndex + 3, -1);

      if (field && value) {
        return `Field ${field} with value ${value} already exists`;
      }
    }

    return detail;
  }
}
