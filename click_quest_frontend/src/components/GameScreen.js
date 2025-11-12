import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Target from './Target';

/**
 * GameScreen
 * - 30s timer starts on mount
 * - Displays score and time in top bar with progress
 * - Spawns moving targets within play area; clicking increments score
 * - Respects prefers-reduced-motion
 * - Calls onFinish(score, elapsedMs) when time is up
 *
 * Scoring behavior:
 * - Base per-hit value increased to +5
 * - Optional time-decayed combo multiplier (x1..x3) within a short window (2s)
 *   - Combo grows to next tier on each hit within window, capped at x3
 *   - Decays by one tier after 2s of inactivity until x1
 * - Feature flag: enable combo if REACT_APP_FEATURE_FLAGS includes "fast-score" or "combo"
 */

// console-safe debug helper (no-op in environments without console)
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
export default function GameScreen({ onFinish, prefersReducedMotion }) {
  const DURATION_MS = 30000;

  // Feature flags: enable combo by default if flags contain "fast-score" or "combo"
  const featureFlags = (process.env.REACT_APP_FEATURE_FLAGS || '').toLowerCase();
  const comboEnabled = useMemo(
    () => featureFlags.includes('fast-score') || featureFlags.includes('combo'),
    [featureFlags]
  );

  const BASE_POINTS = 5; // increased base per-hit points
  const COMBO_WINDOW_MS = 2000;
  const COMBO_MAX = 3;

  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);

  // Keep a mirror ref of score for onFinish accuracy within RAF loop
  const scoreRef = useRef(0);
  useEffect(() => {
    // guard against NaN/undefined
    const safe = Number.isFinite(score) ? score : 0;
    scoreRef.current = safe;
  }, [score]);

  // combo state
  const [combo, setCombo] = useState(1);
  const lastHitRef = useRef(0);
  const comboTimerRef = useRef(null);

  const areaRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const lastSpawnRef = useRef(0);

  const [targets, setTargets] = useState([]);
  // Each target: { id, x, y, vx, vy, size }

  const reset = useCallback(() => {
    setScore(0);
    setElapsed(0);
    setTargets([]);
    setRunning(true);
    setCombo(1);
    scoreRef.current = 0;
    startRef.current = 0;
    lastSpawnRef.current = 0;
    lastHitRef.current = 0;
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    reset();
    return () => {
      if (rafRef.current?.id) cancelAnimationFrame(rafRef.current.id);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, [reset]);

  const spawnTarget = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();

    const size = Math.round(36 + Math.random() * 28); // 36-64
    const x = Math.random() * (rect.width - size) + size / 2;
    const y = Math.random() * (rect.height - size) + size / 2;

    // velocity px/s; lower if reduced motion
    const speedBase = prefersReducedMotion ? 40 : 120;
    const vx = (Math.random() * 2 - 1) * speedBase;
    const vy = (Math.random() * 2 - 1) * speedBase;

    setTargets((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        x,
        y,
        vx,
        vy,
        size,
      },
    ]);
  }, [prefersReducedMotion]);

  /**
   * Handle target removal and scoring.
   * Applies base points and optional combo multiplier without affecting animations.
   * This uses only refs inside the state updater to avoid stale closure issues.
   */
  const removeTarget = useCallback(
    (id) => {
      // Remove the target first so UI reflects the hit quickly
      setTargets((prev) => prev.filter((t) => t.id !== id));

      // Update score atomically; reference combo using refs/time to avoid stale values
      setScore((prevScore) => {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

        let nextCombo = 1;
        if (comboEnabled) {
          const within = now - (lastHitRef.current || 0) <= COMBO_WINDOW_MS;
          const currentCombo = typeof combo === 'number' && Number.isFinite(combo) ? combo : 1;
          nextCombo = within ? Math.min(COMBO_MAX, currentCombo + 1) : 1;

          // schedule decay back by one tier after inactivity window
          if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
          comboTimerRef.current = setTimeout(() => {
            setCombo((c) => Math.max(1, (Number.isFinite(c) ? c : 1) - 1));
          }, COMBO_WINDOW_MS);

          lastHitRef.current = now;
          setCombo(nextCombo);
        }

        const gained = BASE_POINTS * nextCombo;
        const safePrev = Number.isFinite(prevScore) ? prevScore : 0;
        const newScore = safePrev + gained;

        // mirror to ref so RAF loop has latest immediately
        scoreRef.current = newScore;

        dbg('hit', { gained, nextCombo, newScore });
        return newScore;
      });
    },
    [combo, comboEnabled]
  );

  const loop = useCallback(
    (ts) => {
      if (!running) return;
      if (!startRef.current) {
        startRef.current = ts;
        lastSpawnRef.current = ts;
      }
      const dt = ts - (rafRef.current ? rafRef.current.ts : ts);
      const elapsedLocal = ts - startRef.current;
      setElapsed(elapsedLocal);

      // End condition
      if (elapsedLocal >= DURATION_MS) {
        setRunning(false);
        // Use ref to avoid any race where state hasn't flushed yet
        const finalScore = Number.isFinite(scoreRef.current) ? scoreRef.current : 0;
        onFinish?.(finalScore, DURATION_MS);
        return;
      }

      // Spawn targets at interval
      const spawnInterval = prefersReducedMotion ? 1400 : 800;
      if (ts - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = ts;
        // Keep a cap on targets
        setTargets((prev) => (prev.length < 8 ? (spawnTarget(), prev) : prev));
      }

      // Move targets
      const area = areaRef.current;
      if (area) {
        const rect = area.getBoundingClientRect();
        setTargets((prev) =>
          prev.map((t) => {
            const ndt = Math.min(48, Math.max(8, dt)); // clamp dt
            let nx = t.x + (t.vx * ndt) / 1000;
            let ny = t.y + (t.vy * ndt) / 1000;
            let nvx = t.vx;
            let nvy = t.vy;

            const half = t.size / 2;
            if (nx - half < 0) {
              nx = half;
              nvx = Math.abs(nvx);
            } else if (nx + half > rect.width) {
              nx = rect.width - half;
              nvx = -Math.abs(nvx);
            }
            if (ny - half < 0) {
              ny = half;
              nvy = Math.abs(nvy);
            } else if (ny + half > rect.height) {
              ny = rect.height - half;
              nvy = -Math.abs(nvy);
            }
            return { ...t, x: nx, y: ny, vx: nvx, vy: nvy };
          })
        );
      }

      rafRef.current = { id: requestAnimationFrame(loop), ts };
    },
    [DURATION_MS, onFinish, prefersReducedMotion, running, spawnTarget]
  );

  useEffect(() => {
    if (!running) return;
    const id = requestAnimationFrame(loop);
    rafRef.current = { id, ts: typeof performance !== 'undefined' ? performance.now() : Date.now() };
    return () => cancelAnimationFrame(id);
  }, [loop, running]);

  const progress = useMemo(
    () => Math.min(100, (elapsed / DURATION_MS) * 100),
    [elapsed]
  );

  const scoreLabel = useMemo(() => {
    const safe = Number.isFinite(score) ? score : 0;
    return `🏆 Score: ${safe}`;
  }, [score]);

  return (
    <section className="game-wrap" aria-label="Game Screen">
      <div className="top-bar">
        <div className="stat" aria-live="polite" aria-label="Score">
          {scoreLabel}
          {comboEnabled && combo > 1 ? <span className="combo">x{combo}</span> : null}
        </div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <div className="bar" style={{ width: `${100 - progress}%` }} />
        </div>
        <div className="stat" aria-live="polite" aria-label="Time Remaining">
          ⏱️ {Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000))}s
        </div>
      </div>

      <div
        ref={areaRef}
        className="play-area"
        role="application"
        aria-label="Play Area"
      >
        {targets.map((t, idx) => (
          <Target
            key={t.id}
            x={t.x}
            y={t.y}
            size={t.size}
            label={idx % 3 === 0 ? '+' : ''}
            prefersReducedMotion={prefersReducedMotion}
            onHit={() => removeTarget(t.id)}
          />
        ))}
      </div>
    </section>
  );
}
