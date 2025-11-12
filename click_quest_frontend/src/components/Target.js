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

  useEffect(() => {
    if (!hit) return;
    const t = setTimeout(() => {
      // fully remove after animation
      onHit?.();
    }, prefersReducedMotion ? 0 : 250);
    return () => clearTimeout(t);
  }, [hit, onHit, prefersReducedMotion]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (hit) return;
    setHit(true);
  };

  const style = {
    left: Math.max(0, x - size / 2),
    top: Math.max(0, y - size / 2),
    width: size,
    height: size,
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
