import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Target from '../components/Target';

describe('Target', () => {
  test('has aria-label and is focusable', () => {
    render(<Target x={50} y={50} size={40} label="+" onHit={() => {}} prefersReducedMotion />);
    const btn = screen.getByRole('button', { name: 'Target' });
    expect(btn).toBeInTheDocument();
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });

  test('fires onHit only once for a click', () => {
    jest.useFakeTimers();
    const onHit = jest.fn();
    render(<Target x={50} y={50} size={40} label="+" onHit={onHit} prefersReducedMotion={false} />);
    const btn = screen.getByRole('button', { name: 'Target' });

    fireEvent.click(btn);
    // Effect waits ~250ms when reducedMotion=false
    jest.advanceTimersByTime(300);
    expect(onHit).toHaveBeenCalledTimes(1);

    // Further clicks should not fire again
    fireEvent.click(btn);
    jest.advanceTimersByTime(300);
    expect(onHit).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('keyboard Enter triggers once', () => {
    jest.useFakeTimers();
    const onHit = jest.fn();
    render(<Target x={50} y={50} size={40} label="+" onHit={onHit} prefersReducedMotion />);
    const btn = screen.getByRole('button', { name: 'Target' });

    fireEvent.keyDown(btn, { key: 'Enter' });
    jest.advanceTimersByTime(0);
    expect(onHit).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
