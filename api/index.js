import app from '../server/index.js';

// Vercel owns the HTTP listener; importing the app must not start a server.
export default app;
