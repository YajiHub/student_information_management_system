import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If response already formatted or null
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return res;
        }

        let message = 'Operation completed successfully.';
        let data = res;
        let meta: any = undefined;

        if (res && typeof res === 'object' && !Array.isArray(res)) {
          if ('message' in res && typeof res.message === 'string') {
            message = res.message;
          }
          if ('data' in res) {
            data = res.data;
          }
          if ('meta' in res) {
            meta = res.meta;
          }
        }

        const response: ApiResponse<T> = {
          success: true,
          message,
          data,
        };

        if (meta !== undefined) {
          response.meta = meta;
        }

        return response;
      }),
    );
  }
}
