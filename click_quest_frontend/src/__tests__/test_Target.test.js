import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import Target from '../components/Target';

describe('Target', () => {
  test('has aria-label and is focusable', () => {
    render(<Target x={50} y={50} size={40} label="+" onHit={() => {}} prefersReducedMotion />);
    const btn = screen.getByRole('button', { name: 'Target' });
    expect(btn).toBeInTheDocument();
    act(() => {
      btn.focus();
    });
    expect(document.activeElement).toBe(btn);
  });

  test('fires onHit only once for a click', async () => {
    jest.useFakeTimers();
    const onHit = jest.fn();
    render(<Target x={50} y={50} size={40} label="+" onHit={onHit} prefersReducedMotion={false} />);
    const btn = screen.getByRole('button', { name: 'Target' });

    await act(async () => {
      fireEvent.click(btn);
      // Flush pending timers deterministically
      jest.advanceTimersByTime(1);
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => expect(onHit).toHaveBeenCalledTimes(1));

    // Further clicks should not fire again
    await act(async () => {
      fireEvent.click(btn);
      jest.advanceTimersByTime(1);
      jest.runOnlyPendingTimers();
    });
    expect(onHit).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('keyboard Enter triggers once', async () => {
    jest.useFakeTimers();
    const onHit = jest.fn();
    render(<Target x={50} y={50} size={40} label="+" onHit={onHit} prefersReducedMotion />);
    const btn = screen.getByRole('button', { name: 'Target' });

    await act(async () => {
      fireEvent.keyDown(btn, { key: 'Enter' });
      // Flush immediate timers
      jest.advanceTimersByTime(1);
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => expect(onHit).toHaveBeenCalledTimes(1));
    jest.useRealTimers();
  });
});
