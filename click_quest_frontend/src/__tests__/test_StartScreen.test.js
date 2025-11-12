import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StartScreen from '../components/StartScreen';

describe('StartScreen', () => {
  it('renders title and focuses the Play button', () => {
    render(<StartScreen onPlay={() => {}} />);
    expect(screen.getByRole('heading', { name: /click quest/i })).toBeInTheDocument();
    const playButton = screen.getByRole('button', { name: /start game/i });
    expect(playButton).toBeInTheDocument();
    // Focus should be set on mount
    expect(document.activeElement).toBe(playButton);
  });

  it('calls onPlay when Play is clicked', () => {
    const onPlay = jest.fn();
    render(<StartScreen onPlay={onPlay} />);
    fireEvent.click(screen.getByRole('button', { name: /start game/i }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });
});
