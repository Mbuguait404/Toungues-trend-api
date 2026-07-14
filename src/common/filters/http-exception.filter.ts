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

    let message: string;
    if (exception instanceof HttpException) {
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const msg = (exceptionResponse as any).message;
        message = Array.isArray(msg) ? 'Validation failed' : (msg ?? 'An error occurred');
      } else {
        message = (exceptionResponse as string) ?? 'An error occurred';
      }
    } else if (exception instanceof Error) {
      message = 'Internal server error';
    } else {
      message = 'Internal server error';
    }

    const errors = typeof exceptionResponse === 'object' && exceptionResponse !== null
      ? (exceptionResponse as any).message
      : undefined;

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors: Array.isArray(errors) ? errors : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
