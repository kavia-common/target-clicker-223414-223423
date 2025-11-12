import React from 'react';
import { act, render, screen } from '@testing-library/react';
import GameScreen from '../components/GameScreen';

// Helper to click available targets, advancing timers inside act
function clickTarget(times = 1) {
  const btns = screen.queryAllByRole('button', { name: 'Target' });
  if (btns.length === 0) return;
  for (let i = 0; i < Math.min(times, btns.length); i++) {
    act(() => {
      btns[i].click();
      // Allow Target internal timeout to fire and GameScreen state updates
      jest.advanceTimersByTime(300);
    });
  }
}

describe('GameScreen', () => {
  beforeEach(() => {
    // Configure fake timers BEFORE render so RAF and setTimeout are controlled
    jest.useFakeTimers();

    // Mock getBoundingClientRect for play area and necessary methods
    Element.prototype.getBoundingClientRect = function () {
      // Provide a stable rectangle for movement bounds
      return { width: 600, height: 400, top: 0, left: 0, bottom: 400, right: 600 };
    };

    // Ensure requestAnimationFrame is tied to timers (setupTests does this as a fallback)
    if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
      window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
      window.cancelAnimationFrame = (id) => clearTimeout(id);
    }
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test('increments score by +5 when a target is clicked (base scoring)', () => {
    const onFinish = jest.fn();
    render(<GameScreen onFinish={onFinish} prefersReducedMotion />);
    // Advance timers to allow a spawn and animation ticks
    act(() => {
      jest.advanceTimersByTime(1200);
    });

    // Click available targets
    clickTarget(1);

    // Score text shows 5
    expect(screen.getByLabelText(/score/i)).toHaveTextContent(/score:\s*5/i);
    expect(onFinish).not.toHaveBeenCalled();
  });

  test('combo scoring increases with flag fast-score (x up to 3)', () => {
    process.env.REACT_APP_FEATURE_FLAGS = 'fast-score';
    const onFinish = jest.fn();
    render(<GameScreen onFinish={onFinish} prefersReducedMotion />);
    // Advance to allow multiple spawns
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    // Click three targets rapidly within combo window
    clickTarget(1);
    clickTarget(1);
    clickTarget(1);

    // total 30 expected
    expect(screen.getByLabelText(/score/i)).toHaveTextContent(/30/);
    // combo badge visible
    expect(screen.getByText(/x3/)).toBeInTheDocument();
  });

  test('timer counts down and calls onFinish at ~30s', () => {
    const onFinish = jest.fn();
    render(<GameScreen onFinish={onFinish} prefersReducedMotion />);
    // Simulate full 30s; wrap in act to flush effects and RAF loops
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
    const [finalScore, duration] = onFinish.mock.calls[0];
    expect(typeof finalScore).toBe('number');
    expect(duration).toBe(30000);
    // Progressbar aria-valuenow should be 100 or capped
    const progress = screen.getByRole('progressbar');
    const valNow = Number(progress.getAttribute('aria-valuenow'));
    expect(valNow).toBeGreaterThanOrEqual(0);
    expect(valNow).toBeLessThanOrEqual(100);
  });
});
