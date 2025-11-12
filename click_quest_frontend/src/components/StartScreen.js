import React, { useEffect, useRef } from 'react';

/**
 * StartScreen
 * Centered title and Play button.
 * Accessibility: initial focus on Play button.
 */
export default function StartScreen({ onPlay }) {
  const btnRef = useRef(null);

  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  return (
    <section className="start-wrap" aria-label="Start Screen">
      <div className="surface start-card" role="region" aria-labelledby="game-title">
        <p className="subtitle" aria-hidden="true">Welcome to</p>
        <h1 id="game-title" className="title" style={{ marginTop: 0 }}>
          Click Quest
        </h1>
        <p className="subtitle">
          Click moving targets to score as many points as possible in 30 seconds.
        </p>
        <div>
          <button
            ref={btnRef}
            className="btn btn-large"
            onClick={onPlay}
            aria-label="Start Game"
          >
            ▶ Play
          </button>
        </div>
      </div>
    </section>
  );
}
