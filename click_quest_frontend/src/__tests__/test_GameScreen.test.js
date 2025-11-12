import React from 'react';
import { act, render, screen } from '@testing-library/react';
import GameScreen from '../components/GameScreen';

// Helper to mount and access internal Target by accessible name
function clickTarget(times = 1) {
  const btns = screen.queryAllByRole('button', { name: 'Target' });
  if (btns.length === 0) return;
  for (let i = 0; i < Math.min(times, btns.length); i++) {
    // Trigger click; Target delays onHit depending on motion
    btns[i].click();
    jest.advanceTimersByTime(300);
  }
}

describe('GameScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock getBoundingClientRect for play area and necessary methods
    Element.prototype.getBoundingClientRect = function () {
      // Provide a stable rectangle for movement bounds
      return { width: 600, height: 400, top: 0, left: 0, bottom: 400, right: 600 };
    };
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('increments score by +5 when a target is clicked (base scoring)', () => {
    const onFinish = jest.fn();
    render(<GameScreen onFinish={onFinish} prefersReducedMotion />);
    // Force spawn quickly by advancing RAF to pass spawn interval
    act(() => {
      // First RAF to init, then pass spawn interval
      jest.advanceTimersByTime(1);
      jest.advanceTimersByTime(10);
    });

    // Repeatedly advance RAF to create and process animation/movements
    for (let i = 0; i < 10; i++) {
      act(() => {
        jest.advanceTimersByTime(100);
      });
    }
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
    for (let i = 0; i < 20; i++) {
      act(() => {
        jest.advanceTimersByTime(150);
      });
    }
    // Click three targets rapidly within combo window
    clickTarget(1);
    clickTarget(1);
    clickTarget(1);
    // Expected score: 5 (x2) + 10 (x3) + 15? Actually logic: nextCombo starts at 1, then increments for each hit:
    // first hit: withinWindow false => combo 1 => +5
    // second hit: withinWindow true -> combo becomes 2 => +10
    // third hit: withinWindow true -> combo becomes 3 => +15
    // total 30
    expect(screen.getByLabelText(/score/i)).toHaveTextContent(/30/);
    // combo badge visible
    expect(screen.getByText(/x3/)).toBeInTheDocument();
  });

  test('timer counts down and calls onFinish at ~30s', () => {
    const onFinish = jest.fn();
    render(<GameScreen onFinish={onFinish} prefersReducedMotion />);
    // Simulate full 30s
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
