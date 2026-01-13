/* eslint-disable import/first */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-global-assign */
/* eslint-disable no-undef */
/* eslint-env browser */

// Polyfill global BEFORE any other imports (especially WebTorrent)
if (typeof global === 'undefined') {
  if (typeof globalThis !== 'undefined') {
    // @ts-ignore
    // eslint-disable-next-line no-global-assign
    global = globalThis;
  } else if (typeof window !== 'undefined') {
    // @ts-ignore
    // eslint-disable-next-line no-global-assign
    global = window;
  } else if (typeof self !== 'undefined') {
    // @ts-ignore
    // eslint-disable-next-line no-global-assign
    global = self;
  }
}

// Ensure process is available globally for WebTorrent
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  try {
    window.process = require('process/browser.js');
  } catch (e) {
    // Fallback if require doesn't work
    window.process = { env: { NODE_ENV: 'development' } };
  }
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
/* eslint-enable import/first */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Measure performance (optional - can be removed if not needed)
reportWebVitals();
