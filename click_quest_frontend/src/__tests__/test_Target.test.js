import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

  test('fires onHit only once for a click', () => {
    jest.useFakeTimers();
    const onHit = jest.fn();
    render(<Target x={50} y={50} size={40} label="+" onHit={onHit} prefersReducedMotion={false} />);
    const btn = screen.getByRole('button', { name: 'Target' });

    act(() => {
      fireEvent.click(btn);
      // Flush pending timers deterministically
      jest.runOnlyPendingTimers();
    });
    expect(onHit).toHaveBeenCalledTimes(1);

    // Further clicks should not fire again
    act(() => {
      fireEvent.click(btn);
      jest.runOnlyPendingTimers();
    });
    expect(onHit).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('keyboard Enter triggers once', () => {
    jest.useFakeTimers();
    const onHit = jest.fn();
    render(<Target x={50} y={50} size={40} label="+" onHit={onHit} prefersReducedMotion />);
    const btn = screen.getByRole('button', { name: 'Target' });

    act(() => {
      fireEvent.keyDown(btn, { key: 'Enter' });
      // Flush immediate timers
      jest.runOnlyPendingTimers();
    });
    expect(onHit).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
