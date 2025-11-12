let getLeaderboard, submitScore, __test;

const originalEnv = { ...process.env };

beforeEach(async () => {
  jest.resetModules();
  // Force base URL for all api.js imports in this test file
  process.env.REACT_APP_API_BASE = 'http://localhost:3001';
  global.fetch = jest.fn();

  // Import after env is set so api.js reads the forced env
  const apiMod = await import('../api');
  getLeaderboard = apiMod.getLeaderboard;
  submitScore = apiMod.submitScore;
  __test = apiMod.__test;
});

afterEach(() => {
  process.env = { ...originalEnv };
  jest.clearAllMocks();
});

describe('api client', () => {
  test('getBaseUrl respects env variables', () => {
    // Override and re-import to validate normalization
    process.env.REACT_APP_API_BASE = 'http://example.com/';
    jest.resetModules();
    return import('../api').then((apiMod) => {
      const { getBaseUrl } = apiMod.__test;
      expect(getBaseUrl()).toBe('http://example.com');
    });
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
