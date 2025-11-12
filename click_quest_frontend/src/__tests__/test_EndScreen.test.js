import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import * as api from '../api';
import EndScreen from '../components/EndScreen';

describe('EndScreen', () => {
  beforeEach(() => {
    jest.spyOn(api, 'getLeaderboard').mockResolvedValue([
      { name: 'Alice', score: 40, durationMs: 30000 },
      { name: 'Bob', score: 35, durationMs: 30000 },
    ]);
    jest.spyOn(api, 'submitScore').mockResolvedValue({ id: 1 });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('loads leaderboard and shows rows', async () => {
    render(<EndScreen score={25} durationMs={30000} onRestart={() => {}} />);
    expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
    expect(await screen.findByText(/alice/i)).toBeInTheDocument();
    expect(screen.getByText(/bob/i)).toBeInTheDocument();
  });

  test('validates name length and prevents submit when invalid', async () => {
    render(<EndScreen score={15} durationMs={30000} onRestart={() => {}} />);
    const input = screen.getByLabelText(/name/i);
    const submit = screen.getByRole('button', { name: /submit/i });

    // Empty: invalid so disabled
    expect(submit).toBeDisabled();

    // Too long name => invalid
    fireEvent.change(input, { target: { value: 'x'.repeat(21) } });
    expect(submit).toBeDisabled();

    // Valid
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(submit).not.toBeDisabled();
  });

  test('submits score and refreshes leaderboard', async () => {
    const getSpy = jest.spyOn(api, 'getLeaderboard');
    render(<EndScreen score={50} durationMs={30000} onRestart={() => {}} />);
    // initial loadBoard
    await screen.findByText(/alice/i);

    const input = screen.getByLabelText(/name/i);
    fireEvent.change(input, { target: { value: 'Player1' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // submitScore called with payload
    await act(async () => {});
    expect(api.submitScore).toHaveBeenCalledWith({ name: 'Player1', score: 50, durationMs: 30000 });
    // leaderboard reload called again after submit
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  test('shows error message when submission fails', async () => {
    jest.spyOn(api, 'submitScore').mockRejectedValueOnce(new Error('fail'));
    render(<EndScreen score={10} durationMs={30000} onRestart={() => {}} />);
    await screen.findByText(/alice/i);
    const input = screen.getByLabelText(/name/i);
    fireEvent.change(input, { target: { value: 'P1' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    // Error shows
    expect(await screen.findByText(/failed to submit score/i)).toBeInTheDocument();
  });
});
