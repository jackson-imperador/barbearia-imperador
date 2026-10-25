import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  message?: string;
  statusCode: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map(data => {
        // If the service already formatted it (e.g. pagination object), pass it through structured
        if (data && typeof data === 'object' && ('data' in data) && ('meta' in data)) {
          return {
            ...data,
            statusCode: response.statusCode,
          };
        }
        
        // Otherwise wrap it standardly
        return {
          data,
          statusCode: response.statusCode,
        };
      }),
    );
  }
}
