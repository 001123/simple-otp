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

// Initialize i18n translations for component test suites
require('./src/services/i18n');

// Mock lucide-react-native for Jest environment
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '__esModule') return true;
        const MockComponent = (props) =>
          React.createElement(View, {
            ...props,
            testID: props.testID || `lucide-${String(prop).toLowerCase()}`,
          });
        MockComponent.displayName = `Lucide${String(prop)}`;
        return MockComponent;
      },
    }
  );
});

module.exports = {};
