import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Target from './Target';

/**
 * GameScreen
 * Core gameplay. Handles timer, targets, and scoring with optional combo.
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

  // Feature flags
  const featureFlags = (process.env.REACT_APP_FEATURE_FLAGS || '').toLowerCase();
  const comboEnabled = useMemo(
    () => featureFlags.includes('fast-score') || featureFlags.includes('combo'),
    [featureFlags]
  );

  const BASE_POINTS = 5;
  const COMBO_WINDOW_MS = 2000;
  const COMBO_MAX = 3;

  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);

  // Mirror score in ref to avoid stale reads in RAF loop
  const scoreRef = useRef(0);
  useEffect(() => {
    scoreRef.current = Number.isFinite(score) ? score : 0;
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

    const speedBase = prefersReducedMotion ? 40 : 120; // px/s
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
   * Uses functional setState and refs to avoid stale closures.
   */
  const removeTarget = useCallback(
    (id) => {
      // Remove the target immediately
      setTargets((prev) => prev.filter((t) => t.id !== id));

      // Update score atomically
      setScore((prevScore) => {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

        let nextCombo = 1;
        if (comboEnabled) {
          const withinWindow = now - (lastHitRef.current || 0) <= COMBO_WINDOW_MS;
          // Read current combo from state safely
          nextCombo = withinWindow ? Math.min(COMBO_MAX, (Number.isFinite(combo) ? combo : 1) + 1) : 1;

          // Reset decay timer
          if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
          comboTimerRef.current = setTimeout(() => {
            setCombo((c) => Math.max(1, (Number.isFinite(c) ? c : 1) - 1));
          }, COMBO_WINDOW_MS);

          lastHitRef.current = now;
          setCombo(nextCombo);
        }

        const safePrev = Number.isFinite(prevScore) ? prevScore : 0;
        const gained = BASE_POINTS * nextCombo;
        const newScore = safePrev + gained;

        scoreRef.current = newScore;
        dbg('hit', { gained, combo: nextCombo, total: newScore });
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

      if (elapsedLocal >= DURATION_MS) {
        setRunning(false);
        const finalScore = Number.isFinite(scoreRef.current) ? scoreRef.current : 0;
        try {
          onFinish?.(finalScore, DURATION_MS);
        } catch {
          /* no-op */
        }
        return;
      }

      // Spawn targets at interval
      const spawnInterval = prefersReducedMotion ? 1400 : 800;
      if (ts - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = ts;
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

  const progress = useMemo(() => Math.min(100, (elapsed / DURATION_MS) * 100), [elapsed]);

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
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
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
        // Ensure the play area doesn't block clicks; children handle their own events
        style={{ pointerEvents: 'none' }}
      >
        {targets.map((t, idx) => (
          <Target
            key={t.id}
            x={t.x}
            y={t.y}
            size={t.size}
            label={idx % 3 === 0 ? '+' : ''}
            prefersReducedMotion={prefersReducedMotion}
            // Child receives pointer events; keep it enabled
            onHit={() => removeTarget(t.id)}
          />
        ))}
      </div>
    </section>
  );
}
