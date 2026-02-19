if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
  process.env.NODE_ENV = 'test';
}

import { createRequire } from 'module';
import { act as reactAct } from 'react';
import '@testing-library/jest-dom';

const nodeRequire = createRequire(__filename);
const reactCjs = nodeRequire('react');

if (!reactCjs.act) {
  reactCjs.act = reactAct;
}

// Polyfill scrollIntoView for jsdom environment
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => {},
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  value: () => {},
  writable: true,
});
