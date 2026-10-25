import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes.constant';

export class ApplicationException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: any
  ) {
    super({ code, message, details }, status);
  }
}

export class ValidationException extends ApplicationException {
  constructor(details: any) {
    super(ErrorCodes.VALIDATION_ERROR, 'Validation failed', HttpStatus.BAD_REQUEST, details);
  }
}
