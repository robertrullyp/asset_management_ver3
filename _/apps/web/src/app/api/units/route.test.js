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

  it('keeps falsy values when provided', async () => {
    const sql = (await import('../utils/sql')).default;
    const req = new Request('http://localhost/api/units', {
      method: 'POST',
      body: JSON.stringify({
        unit_name: 'Test Unit',
        serial_number: '',
        fuel_filter_qty: 0
      })
    });

    await POST(req);

    const params = sql.mock.calls[0][1];
    expect(params[5]).toBe('');
    expect(params[22]).toBe(0);
  });
});
