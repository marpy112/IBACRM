const cors = require('cors');

function parseAllowedOrigins(value) {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createCorsMiddleware() {
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGINS);

  return cors({
    origin(origin, callback) {
      // Allow non-browser tools and same-origin server-side calls.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  });
}

module.exports = { createCorsMiddleware, parseAllowedOrigins };
