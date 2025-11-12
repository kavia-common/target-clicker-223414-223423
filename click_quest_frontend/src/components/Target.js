import React, { useEffect, useRef, useState } from 'react';

/**
 * Target
 * Renders a clickable moving target.
 * Props:
 * - x, y: position in pixels
 * - size: diameter in px
 * - label: optional text inside target
 * - onHit: callback when clicked
 * - prefersReducedMotion: boolean to limit animations
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

  useEffect(() => {
    if (!hit) return;
    const t = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        // fully remove after animation
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
    e.stopPropagation();
    if (hit || firedRef.current) return;
    setHit(true);
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
  };

  return (
    <button
      ref={ref}
      className={`target${hit ? ' hit' : ''}`}
      style={style}
      onClick={handleClick}
      aria-label="Target"
      title="Target"
    >
      <span aria-hidden="true">{label ?? ''}</span>
    </button>
  );
}
