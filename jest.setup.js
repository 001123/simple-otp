// jest.setup.js
// Setup environment polyfills and test fixtures for Simple OTP
const crypto = require('crypto');

// Ensure Web Crypto API is fully accessible in Node test runner for cryptographic operations
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto.webcrypto;
}
if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = (buffer) => crypto.randomFillSync(buffer);
}

module.exports = {};
