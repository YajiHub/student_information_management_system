import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { catchError, concatMap } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service';

const ACTION_BY_METHOD: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Records every mutating request (and authentication attempt) into the audit
 * trail. Read-only traffic is skipped so the log stays a change history.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const method: string = request.method;

    if (!AUDITED_METHODS.includes(method)) {
      return next.handle();
    }

    const startedAt = Date.now();

    // Persist before the response is released: an audit entry must exist for
    // every mutation the client was told about, including rejected ones.
    return next.handle().pipe(
      concatMap(async (data) => {
        await this.write(request, response.statusCode, startedAt, null, data);
        return data;
      }),
      catchError((error) => from(this.writeFailure(request, response, startedAt, error))),
    );
  }

  private async writeFailure(
    request: any,
    response: any,
    startedAt: number,
    error: any,
  ): Promise<never> {
    const status =
      error instanceof HttpException ? error.getStatus() : response.statusCode || 500;
    await this.write(request, status, startedAt, error);
    throw error;
  }

  private async write(
    request: any,
    statusCode: number,
    startedAt: number,
    error: any,
    payload?: any,
  ): Promise<void> {
    const rawPath: string = request.originalUrl || request.url || '';
    const path = rawPath.split('?')[0];
    const user = request.user || {};
    const segments = path.split('/').filter(Boolean);
    // Paths look like /api/v1/<resource>/<id>
    const resourceIndex = segments[0] === 'api' ? 2 : 0;
    const resource = segments[resourceIndex] || null;
    // Creates carry no id in the URL: take it from the returned entity instead.
    const bodyId = payload?.data?.id ?? payload?.id;
    const resourceId =
      segments[resourceIndex + 1] ?? (bodyId !== undefined && bodyId !== null ? String(bodyId) : null);
    const action = path.endsWith('/auth/login')
      ? 'LOGIN'
      : path.endsWith('/auth/logout')
        ? 'LOGOUT'
        : (ACTION_BY_METHOD[request.method] ?? request.method);

    // Login attempts run before authentication, so fall back to the submitted
    // email (never the password) to keep failed sign-ins traceable.
    const actorEmail = user.email ?? (action === 'LOGIN' ? (request.body?.email ?? null) : null);

    const rawError = error?.response?.message ?? error?.message;
    const errorMessage = rawError
      ? (Array.isArray(rawError) ? rawError.join('; ') : String(rawError)).slice(0, 500)
      : null;

    await this.auditLogService.record({
      actor_id: user.id ?? null,
      actor_email: actorEmail,
      actor_role: user.role ?? null,
      action,
      method: request.method,
      path,
      resource,
      resource_id: resourceId,
      status_code: statusCode,
      success: statusCode < 400,
      duration_ms: Date.now() - startedAt,
      ip: request.ip ?? request.socket?.remoteAddress ?? null,
      user_agent: (request.headers?.['user-agent'] || '').slice(0, 255) || null,
      error_message: errorMessage,
    });
  }
}
