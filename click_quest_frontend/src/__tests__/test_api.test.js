import { getLeaderboard, submitScore, __test } from '../api';

const originalEnv = { ...process.env };
beforeEach(() => {
  jest.resetModules();
  global.fetch = jest.fn();
});
afterEach(() => {
  process.env = { ...originalEnv };
  jest.clearAllMocks();
});

describe('api client', () => {
  test('getBaseUrl respects env variables', async () => {
    process.env.REACT_APP_API_BASE = 'http://example.com/';
    const { getBaseUrl } = __test;
    expect(getBaseUrl()).toBe('http://example.com');
  });

  test('getLeaderboard calls correct endpoint', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => [{ name: 'A', score: 1, durationMs: 1000 }],
    });
    const res = await getLeaderboard(10);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/leaderboard?limit=10',
      expect.objectContaining({ method: 'GET' })
    );
    expect(Array.isArray(res)).toBe(true);
  });

  test('submitScore posts payload and returns json', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 1 }),
    });
    const payload = { name: 'Alice', score: 50, durationMs: 30000 };
    const res = await submitScore(payload);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/scores',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    expect(res).toEqual({ id: 1 });
  });

  test('submitScore throws on 400 error', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'bad' }),
    });
    await expect(
      submitScore({ name: 'X', score: 0, durationMs: 1 })
    ).rejects.toThrow(/bad|HTTP 400/);
  });
});
