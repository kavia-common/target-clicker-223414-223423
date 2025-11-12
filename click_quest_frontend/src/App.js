import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import './index.css';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import EndScreen from './components/EndScreen';

/**
 * App orchestrates screen flow and theme.
 * Screens: Start -> Game (30s) -> End (submit + leaderboard).
 */

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [screen, setScreen] = useState('start'); // 'start' | 'game' | 'end'
  const [score, setScore] = useState(0);
  const [durationMs, setDurationMs] = useState(30000);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleStart = () => {
    setScore(0);
    setScreen('game');
  };

  const handleGameEnd = (finalScore, elapsedMs) => {
    setScore(finalScore);
    setDurationMs(elapsedMs);
    setScreen('end');
  };

  const handleRestart = () => {
    setScore(0);
    setScreen('start');
  };

  const appClass = useMemo(
    () => `App theme-${theme} ${prefersReducedMotion ? 'reduced-motion' : ''}`,
    [theme, prefersReducedMotion]
  );

  // Manage focus when screens change (basic accessibility)
  const containerRef = useRef(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, [screen]);

  return (
    <div className={appClass}>
      <header className="app-header-surface">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <main
          ref={containerRef}
          tabIndex="-1"
          aria-live="polite"
          className="container"
        >
          {screen === 'start' && (
            <StartScreen onPlay={handleStart} />
          )}
          {screen === 'game' && (
            <GameScreen onFinish={handleGameEnd} prefersReducedMotion={prefersReducedMotion} />
          )}
          {screen === 'end' && (
            <EndScreen
              score={score}
              durationMs={durationMs}
              onRestart={handleRestart}
            />
          )}
        </main>
      </header>
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(!!mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export default App;
