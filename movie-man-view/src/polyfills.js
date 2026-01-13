// Polyfills for Node.js globals needed by WebTorrent
// This file must be loaded BEFORE any other imports

// Polyfill global (Node.js global variable)
if (typeof global === 'undefined') {
  if (typeof globalThis !== 'undefined') {
    // @ts-ignore
    global = globalThis;
  } else if (typeof window !== 'undefined') {
    // @ts-ignore
    global = window;
  } else if (typeof self !== 'undefined') {
    // @ts-ignore
    global = self;
  }
}

// Ensure process is available globally for WebTorrent
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  try {
    // @ts-ignore
    window.process = require('process/browser.js');
  } catch (e) {
    // Fallback if require doesn't work
    window.process = { env: { NODE_ENV: 'development' } };
  }
}

