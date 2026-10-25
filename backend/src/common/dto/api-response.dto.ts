export class ApiResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  nextCursor?: string;
}

export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  meta?: ApiResponseMeta;
  error?: any;
  message?: string;
  timestamp: string;
  requestId?: string;
}
