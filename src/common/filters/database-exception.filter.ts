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
    const match = detail.match(/\((.*?)\)=\((.*?)\)/);
    if (match) {
      return `Field ${match[1]} with value ${match[2]} already exists`;
    }
    return detail;
  }
}
