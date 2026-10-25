import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes.constant';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any = exception instanceof HttpException
      ? exception.getResponse()
      : null;

    let code = ErrorCodes.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details = null;

    if (exceptionResponse) {
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        code = exceptionResponse.code || this.mapStatusToCode(status);
        message = exceptionResponse.message || message;
        details = exceptionResponse.details || exceptionResponse.error || null;
      }
    } else {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      message = exception.message || message;
    }

    response.status(status).send({
      success: false,
      statusCode: status,
      message,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      requestId: request.id,
      path: request.url,
    });
  }

  private mapStatusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST: return ErrorCodes.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED: return ErrorCodes.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN: return ErrorCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND: return ErrorCodes.NOT_FOUND;
      case HttpStatus.CONFLICT: return ErrorCodes.CONFLICT;
      default: return ErrorCodes.INTERNAL_SERVER_ERROR;
    }
  }
}
