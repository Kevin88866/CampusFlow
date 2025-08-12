// __mocks__/error-guard.js
// Just export a no-op, so Jest never parses the real flow‐generic code.
module.exports = {
  applyWithGuard: (fn) => fn,
};
