import React, { useEffect, useRef, useState } from 'react';

/**
 * Target
 * Renders a clickable moving target with accessible interactions.
 * Ensures it sits above the playfield and receives pointer events.
 */
export default function Target({
  x,
  y,
  size = 48,
  label,
  onHit,
  prefersReducedMotion,
}) {
  const [hit, setHit] = useState(false);
  const ref = useRef(null);
  const firedRef = useRef(false); // guard against multiple onHit firing

  // PUBLIC_INTERFACE
  function handleFire() {
    if (hit || firedRef.current) return;
    setHit(true);
  }

  useEffect(() => {
    if (!hit) return;
    const t = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        try {
          onHit?.();
        } catch {
          /* no-op */
        }
      }
    }, prefersReducedMotion ? 0 : 250);
    return () => clearTimeout(t);
  }, [hit, onHit, prefersReducedMotion]);

  const handleClick = (e) => {
    // Avoid blocking ancestors but ensure our click is processed
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    handleFire();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFire();
    }
  };

  const diam = Number.isFinite(size) ? size : 48;
  const lx = Number.isFinite(x) ? x : 0;
  const ly = Number.isFinite(y) ? y : 0;

  const style = {
    left: Math.max(0, lx - diam / 2),
    top: Math.max(0, ly - diam / 2),
    width: diam,
    height: diam,
    transform: hit ? 'scale(0)' : undefined,
    // Ensure target sits on top and is clickable
    zIndex: 10,
    pointerEvents: 'auto',
  };

  return (
    <button
      ref={ref}
      className={`target${hit ? ' hit' : ''}`}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Target"
      title="Target"
      tabIndex={0}
    >
      <span aria-hidden="true">{label ?? ''}</span>
    </button>
  );
}
