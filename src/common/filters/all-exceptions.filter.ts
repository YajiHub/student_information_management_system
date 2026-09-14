import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected server error occurred.';
    let errors: Record<string, string[]> | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const respObj = exceptionResponse as any;

        // ValidationPipe throws BadRequestException with array of message strings or objects
        if (Array.isArray(respObj.message)) {
          status = HttpStatus.UNPROCESSABLE_ENTITY; // 422
          message = 'Validation failed.';
          errors = {};

          for (const msg of respObj.message) {
            if (typeof msg === 'string') {
              const firstSpace = msg.indexOf(' ');
              const field = firstSpace > -1 ? msg.substring(0, firstSpace) : 'general';
              if (!errors[field]) {
                errors[field] = [];
              }
              errors[field].push(msg);
            } else if (typeof msg === 'object' && msg.property) {
              const field = msg.property;
              const fieldErrors = msg.constraints ? Object.values(msg.constraints) as string[] : [JSON.stringify(msg)];
              errors[field] = fieldErrors;
            }
          }
        } else {
          message = respObj.message || exception.message;
          if (respObj.errors) {
            errors = respObj.errors;
          }
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma error mapping
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT; // 409
          const target = (exception.meta?.target as string[])?.join(', ') || 'resource';
          message = `A conflicting record with unique field (${target}) already exists.`;
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND; // 404
          message = 'Requested resource was not found.';
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST; // 400
          message = 'Foreign key constraint violated: referenced entity does not exist.';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          message = `Database request error (${exception.code}).`;
          break;
        }
      }
    } else {
      // Unknown internal error: log server-side, do not leak internals
      const err = exception as Error;
      this.logger.error(`Internal server error: ${err?.message}`, err?.stack);
      message = 'An unexpected internal server error occurred.';
    }

    response.status(status).json({
      success: false,
      message,
      errors,
    });
  }
}
