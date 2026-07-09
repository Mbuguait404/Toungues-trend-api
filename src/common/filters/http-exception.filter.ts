import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException
      ? exception.getResponse()
      : null;

    const message = exception instanceof HttpException
      ? (typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? (exceptionResponse as any).message
          : exceptionResponse)
      : 'Internal server error';

    const errors = typeof exceptionResponse === 'object' && exceptionResponse !== null
      ? (exceptionResponse as any).message
      : undefined;

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? 'Validation failed' : message,
      errors: Array.isArray(errors) ? errors : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
