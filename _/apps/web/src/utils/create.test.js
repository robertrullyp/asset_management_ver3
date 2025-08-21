import { describe, it, expect, vi, afterEach } from 'vitest';
import create from './create.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('create utility', () => {
  it('fetches record by id', async () => {
    const mockJson = vi.fn().mockResolvedValue([{ id: 1, name: 'foo' }]);
    global.fetch = vi.fn().mockResolvedValue({ json: mockJson });

    const result = await create.db('db').from('items').getById(1);

    expect(fetch).toHaveBeenCalledWith('/api/db/db', expect.objectContaining({
      method: 'POST',
    }));
    expect(result).toEqual({ id: 1, name: 'foo' });
  });

  it('returns null when record not found', async () => {
    const mockJson = vi.fn().mockResolvedValue([]);
    global.fetch = vi.fn().mockResolvedValue({ json: mockJson });

    const result = await create.db('db').from('items').getById(2);

    expect(result).toBeNull();
  });
});
