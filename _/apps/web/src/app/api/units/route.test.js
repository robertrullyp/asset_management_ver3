import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route.js';

vi.mock('../utils/auth-middleware', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { role: 'admin' } })
}));

vi.mock('../utils/sql', () => ({
  default: vi.fn().mockResolvedValue([])
}));

describe('Units API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid sortBy', async () => {
    const req = new Request('http://localhost/api/units?sortBy=invalid');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid body', async () => {
    const req = new Request('http://localhost/api/units', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
