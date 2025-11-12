import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getLeaderboard, submitScore } from '../api';

/**
 * EndScreen
 * Shows final score, allows player to submit name, and displays leaderboard.
 */

// console-safe debug
const dbg = (...args) => {
  try {
    if (typeof window !== 'undefined' && window?.console?.debug) {
      window.console.debug('[Game]', ...args);
    }
  } catch {
    /* no-op */
  }
};

// PUBLIC_INTERFACE
export default function EndScreen({ score, durationMs, onRestart }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const safeDuration = Number.isFinite(durationMs) ? durationMs : 30000;

  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const loadBoard = useCallback(async () => {
    setLoadingBoard(true);
    try {
      const data = await getLeaderboard(10);
      if (Array.isArray(data)) {
        setLeaderboard(data);
      } else if (data && Array.isArray(data.items)) {
        setLeaderboard(data.items);
      } else {
        setLeaderboard([]);
      }
    } catch {
      setLeaderboard([]);
    } finally {
      setLoadingBoard(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const nameValid = useMemo(() => {
    const trimmed = (name || '').trim();
    return trimmed.length >= 1 && trimmed.length <= 20;
  }, [name]);

  const onSubmit = useCallback(async () => {
    const trimmed = (name || '').trim();
    if (!trimmed || trimmed.length > 20) {
      setSubmitError('Name must be 1-20 characters.');
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      // submitScore expects { name, score, durationMs }
      await submitScore({ name: trimmed, score: safeScore, durationMs: safeDuration });
      dbg('submit ok', { name: trimmed, score: safeScore, durationMs: safeDuration });
      await loadBoard();
    } catch (e) {
      setSubmitError('Failed to submit score. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [loadBoard, name, safeDuration, safeScore]);

  return (
    <section className="end-wrap" aria-label="End Screen">
      <div className="surface" role="region" aria-labelledby="final-score">
        <h2 id="final-score" className="score-badge">
          Final Score: {safeScore}
        </h2>

        <div className="form-row" style={{ marginTop: 12 }}>
          <label htmlFor="player-name" style={{ fontWeight: 700 }}>
            Name
          </label>
          <input
            id="player-name"
            ref={inputRef}
            className="input"
            type="text"
            placeholder="Enter your name"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!nameValid}
          />
          <button
            className="btn btn-secondary"
            onClick={onSubmit}
            disabled={!nameValid || submitting}
            aria-label="Submit Score"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
          <button className="btn btn-ghost" onClick={onRestart} aria-label="Play Again">
            ↻ Play Again
          </button>
        </div>
        {!nameValid && name.length > 0 && (
          <p className="error-text" role="alert">
            Name must be between 1 and 20 characters.
          </p>
        )}
        {submitError && (
          <p className="error-text" role="alert">
            {submitError}
          </p>
        )}
      </div>

      <div className="surface leaderboard" role="region" aria-labelledby="leaderboard-title">
        <h3 id="leaderboard-title" style={{ marginTop: 0 }}>Leaderboard</h3>
        {loadingBoard ? (
          <p className="subtitle">Loading...</p>
        ) : leaderboard.length === 0 ? (
          <p className="subtitle">No scores yet. Be the first!</p>
        ) : (
          <div className="table-wrap">
            <table className="table" aria-describedby="leaderboard-title">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 10).map((row, idx) => (
                  <tr key={`${row.name}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.score}</td>
                    <td>{formatDuration(row.durationMs ?? safeDuration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDuration(ms) {
  const total = Math.round((ms || 0) / 1000);
  const s = total % 60;
  const m = Math.floor(total / 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
