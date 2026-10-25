import { ValidationPipe as NestValidationPipe } from '@nestjs/common';
import { ValidationException } from '../exceptions/custom.exception';

export const GlobalValidationPipe = new NestValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) => {
    const formattedErrors = errors.reduce((acc, error) => {
      acc[error.property] = Object.values(error.constraints || {});
      return acc;
    }, {} as any);
    
    return new ValidationException(formattedErrors);
  },
});
