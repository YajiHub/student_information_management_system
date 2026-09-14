import { describe, it, expect, vi } from 'vitest';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { buildPaginationMeta } from '../src/common/dto/pagination-query.dto';
import { of } from 'rxjs';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Common Layer Tests', () => {
  describe('buildPaginationMeta', () => {
    it('should correctly calculate pagination metadata', () => {
      const meta = buildPaginationMeta(100, 2, 20);
      expect(meta).toEqual({
        page: 2,
        per_page: 20,
        total_records: 100,
        total_pages: 5,
        has_next: true,
        has_prev: true,
      });
    });

    it('should handle boundary page 1', () => {
      const meta = buildPaginationMeta(25, 1, 10);
      expect(meta.has_prev).toBe(false);
      expect(meta.has_next).toBe(true);
      expect(meta.total_pages).toBe(3);
    });
  });

  describe('TransformInterceptor', () => {
    const interceptor = new TransformInterceptor();

    it('should wrap raw payload in success envelope', async () => {
      const mockContext: any = {};
      const mockCallHandler: any = {
        handle: () => of({ id: 1, name: 'Test' }),
      };

      const result = await new Promise((resolve) => {
        interceptor.intercept(mockContext, mockCallHandler).subscribe(resolve);
      });

      expect(result).toEqual({
        success: true,
        message: 'Operation completed successfully.',
        data: { id: 1, name: 'Test' },
      });
    });

    it('should preserve custom message and meta', async () => {
      const mockContext: any = {};
      const mockCallHandler: any = {
        handle: () =>
          of({
            message: 'Students retrieved.',
            data: [{ id: 1 }],
            meta: { page: 1 },
          }),
      };

      const result = await new Promise((resolve) => {
        interceptor.intercept(mockContext, mockCallHandler).subscribe(resolve);
      });

      expect(result).toEqual({
        success: true,
        message: 'Students retrieved.',
        data: [{ id: 1 }],
        meta: { page: 1 },
      });
    });
  });

  describe('AllExceptionsFilter', () => {
    const filter = new AllExceptionsFilter();

    it('should convert validation BadRequestException into 422 with structured field errors', () => {
      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const hostMock: any = {
        switchToHttp: () => ({
          getResponse: () => ({ status: statusMock }),
        }),
      };

      const validationException = new BadRequestException([
        'student_number must be formatted as YYYY-NNNNN',
        'email must be an email',
      ]);

      filter.catch(validationException, hostMock);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed.',
        errors: {
          student_number: ['student_number must be formatted as YYYY-NNNNN'],
          email: ['email must be an email'],
        },
      });
    });

    it('should format 404 NotFoundException cleanly', () => {
      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const hostMock: any = {
        switchToHttp: () => ({
          getResponse: () => ({ status: statusMock }),
        }),
      };

      const notFoundException = new NotFoundException('Student record not found.');
      filter.catch(notFoundException, hostMock);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Student record not found.',
        errors: null,
      });
    });
  });
});
