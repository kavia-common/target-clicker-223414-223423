import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import GameScreen from '../components/GameScreen';

// Polyfill/override RAF for deterministic tests if needed
if (typeof window !== 'undefined') {
  window.requestAnimationFrame =
    window.requestAnimationFrame ||
    ((cb) => setTimeout(() => cb(performance.now()), 16));
  window.cancelAnimationFrame =
    window.cancelAnimationFrame || ((id) => clearTimeout(id));
}

// Helper to deterministically click available target buttons.
// - Re-query between clicks because targets are removed/respawned.
// - When multiple targets are present, pick the first deterministically.
// - After each click, advance timers and wait for score update or the clicked element to be removed.
async function clickTargets(times = 1) {
  for (let i = 0; i < times; i++) {
    // eslint-disable-next-line no-await-in-loop
    const buttons = await screen.findAllByRole('button', { name: 'Target' });
    const btn = buttons[0]; // deterministic selection

    await act(async () => {
      btn.click();
      // Let any microtasks/raf-bound updates flush
      jest.advanceTimersByTime(0);
    });

    // eslint-disable-next-line no-await-in-loop
    await waitFor(() => {
      expect(screen.getByLabelText(/score/i)).toHaveTextContent(/Score:\s*\d+/i);
    });
  }
}

describe('GameScreen', () => {
  beforeEach(() => {
    // Configure fake timers BEFORE render so RAF and setTimeout are controlled
    jest.useFakeTimers();

    // Stable rect for movement bounds
    Element.prototype.getBoundingClientRect = function () {
      return { width: 600, height: 400, top: 0, left: 0, bottom: 400, right: 600 };
    };
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    // reset feature flags between tests
    delete process.env.REACT_APP_FEATURE_FLAGS;
  });

  test('increments score by +5 when a target is clicked (base scoring)', async () => {
    const onFinish = jest.fn();
    render(<GameScreen onFinish={onFinish} prefersReducedMotion />);

    // Advance timers to allow a spawn and a couple RAF ticks
    await act(async () => {
      jest.advanceTimersByTime(1200);
    });

    // Ensure first target(s) are present before clicking
    await screen.findAllByRole('button', { name: /Target/i });

    // Click an available target (requerying between clicks is handled)
    await clickTargets(1);

    // Wait for DOM to reflect state update, then assert
    await waitFor(() =>
      expect(screen.getByLabelText(/score/i)).toHaveTextContent(/score:\s*5/i)
    );
    expect(onFinish).not.toHaveBeenCalled();
  });

  test('combo scoring increases with flag fast-score (x up to 3)', async () => {
    process.env.REACT_APP_FEATURE_FLAGS = 'fast-score';
    const onFinish = jest.fn();
    render(<GameScreen onFinish={onFinish} prefersReducedMotion />);

    // Allow multiple spawns and RAF updates
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    // Perform three distinct clicks, re-querying buttons each time to avoid ambiguity.
    await clickTargets(1);
    await act(async () => {
      jest.advanceTimersByTime(200); // slight interval within combo window
    });
    await clickTargets(1);
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    await clickTargets(1);

    // Expect total score 30 (5 + 10 + 15) and combo badge visible x3
    await waitFor(() => expect(screen.getByLabelText(/score/i)).toHaveTextContent(/30/));
    expect(screen.getByText(/x3/)).toBeInTheDocument();
  });

  test('timer counts down and calls onFinish at ~specified duration', async () => {
    const onFinish = jest.fn();
    render(<GameScreen onFinish={onFinish} prefersReducedMotion durationMs={3000} />);

    // Simulate full 3s in act and then flush any pending timers
    await act(async () => {
      jest.advanceTimersByTime(3000);
      jest.runOnlyPendingTimers();
    });

    // Wait a tick for onFinish to be invoked by effects
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));

    const [finalScore, duration] = onFinish.mock.calls[0];
    expect(typeof finalScore).toBe('number');
    expect(duration).toBe(3000);

    const progress = screen.getByRole('progressbar');
    const valNow = Number(progress.getAttribute('aria-valuenow'));
    expect(valNow).toBeGreaterThanOrEqual(0);
    expect(valNow).toBeLessThanOrEqual(100);
  });
});
