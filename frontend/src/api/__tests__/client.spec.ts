import { describe, it, expect, beforeEach, vi } from 'vitest';
import apiClient from '../client';

describe('API Client Interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should inject Authorization Bearer header when token is stored', async () => {
    localStorage.setItem('sims_access_token', 'test-jwt-token-xyz');

    // Test request interceptor directly
    // @ts-expect-error accessing private interceptors for test verification
    const requestInterceptor = apiClient.interceptors.request.handlers[0];
    const config = { headers: {} };
    // @ts-expect-error handler expects config
    const modifiedConfig = await requestInterceptor.fulfilled(config);

    expect(modifiedConfig.headers.Authorization).toBe('Bearer test-jwt-token-xyz');
  });

  it('should clear stored credentials on 401 response', async () => {
    localStorage.setItem('sims_access_token', 'expired-token');
    localStorage.setItem('sims_user', JSON.stringify({ id: 1 }));

    const eventSpy = vi.fn();
    window.addEventListener('sims:unauthorized', eventSpy);

    // Test response error interceptor directly
    // @ts-expect-error accessing private interceptors
    const responseInterceptor = apiClient.interceptors.response.handlers[0];
    const error = {
      response: { status: 401, data: { message: 'Unauthorized' } },
    };

    try {
      await responseInterceptor.rejected?.(error);
    } catch {
      // Expected rejection
    }

    expect(localStorage.getItem('sims_access_token')).toBeNull();
    expect(localStorage.getItem('sims_user')).toBeNull();
    expect(eventSpy).toHaveBeenCalled();
  });
});
