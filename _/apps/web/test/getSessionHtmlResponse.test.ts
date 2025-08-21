import { getSession, authConfigManager } from '@hono/auth-js/react';
import { vi, describe, expect, test } from 'vitest';

describe('getSession', () => {
  test('returns null when response is not JSON', async () => {
    authConfigManager.setConfig({ baseUrl: '', basePath: '' });
    const json = vi.fn();
    const originalFetch = global.fetch;
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'text/html' },
      json,
    });
    const session = await getSession();
    expect(session).toBeNull();
    expect(json).not.toHaveBeenCalled();
    global.fetch = originalFetch;
  });
});
