const cors = require('cors');

function parseAllowedOrigins(value) {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createCorsMiddleware() {
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGINS);

  return cors((req, done) => done(null, {
    origin(origin, callback) {
      // Allow non-browser tools and same-origin server-side calls.
      if (!origin) {
        return callback(null, true);
      }

      // Browser POST/PUT requests can include Origin even on the same domain.
      const requestHost = req.get('x-forwarded-host') || req.get('host');
      let sameOrigin = false;
      try {
        const url = new URL(origin);
        sameOrigin = ['http:', 'https:'].includes(url.protocol) && url.host === requestHost;
      } catch {
        // Invalid origins are checked against the explicit allowlist below.
      }
      if (sameOrigin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  }));
}

module.exports = { createCorsMiddleware, parseAllowedOrigins };
