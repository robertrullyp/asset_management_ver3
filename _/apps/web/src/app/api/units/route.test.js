import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route.js';

let lastRequest;
vi.mock('../utils/auth-middleware', () => ({
  requireRole: vi.fn(() => {
    const cookie = lastRequest?.headers.get('cookie');
    if (cookie === 'session=valid') {
      return { user: { role: 'admin' } };
    }
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }),
}));

vi.mock('../utils/sql', () => ({
  default: vi.fn().mockResolvedValue([]),
}));

describe('Units API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastRequest = undefined;
  });

  it('returns 401 without session cookie', async () => {
    const req = new Request('http://localhost/api/units');
    lastRequest = req;
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toBe('application/json');
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns units when authorized', async () => {
    const req = new Request('http://localhost/api/units', {
      headers: { cookie: 'session=valid' },
    });
    lastRequest = req;
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    const body = await res.json();
    expect(body).toHaveProperty('units');
  });

  it('returns 400 for invalid sortBy', async () => {
    const req = new Request('http://localhost/api/units?sortBy=invalid', {
      headers: { cookie: 'session=valid' },
    });
    lastRequest = req;
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('returns 400 for invalid body', async () => {
    const req = new Request('http://localhost/api/units', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { cookie: 'session=valid' },
    });
    lastRequest = req;
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('keeps falsy values when provided', async () => {
    const sql = (await import('../utils/sql')).default;
    const req = new Request('http://localhost/api/units', {
      method: 'POST',
      body: JSON.stringify({
        unit_name: 'Test Unit',
        serial_number: '',
        fuel_filter_qty: 0,
      }),
      headers: { cookie: 'session=valid' },
    });
    lastRequest = req;
    await POST(req);
    const params = sql.mock.calls[0][1];
    expect(params[5]).toBe('');
    expect(params[22]).toBe(0);
  });
});
