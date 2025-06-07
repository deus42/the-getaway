import '@testing-library/jest-dom';

// Polyfill scrollIntoView for jsdom environment
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => {},
  writable: true,
});
