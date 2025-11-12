/* eslint-disable no-undef */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Provide a global mock for matchMedia used by usePrefersReducedMotion and styles
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

// Tie requestAnimationFrame to setTimeout so tests using fake timers can advance RAF-driven loops
if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
}
