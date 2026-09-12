// server/middleware/rateLimitMiddleware.js
//
// Tiered HTTP rate limiting (backed by the already-installed
// `express-rate-limit`). Without this, rapid-fire requests hit
// controllers + MongoDB directly and can exhaust CPU/memory/
// connections and take the server down.
//
// Tiers:
//   apiLimiter    - lenient global cap for all /api traffic
//   authLimiter   - strict cap for brute-force-sensitive auth routes
//   sensorLimiter - generous cap so IoT devices are never starved
//
// NOTE: requires `app.set('trust proxy', 1)` in server.js (Render
// terminates TLS at its proxy). Without it every client shares one
// IP and the global limiter would throttle all users together.

const { rateLimit } = require('express-rate-limit');

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Consistent 429 body matching the server's { success, message } shape.
const tooManyHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
  });
};

// ============================================================
// GLOBAL API LIMITER — lenient, catches floods/scripts.
// Skips health checks and IoT ingest (those have their own rules).
// ============================================================
const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 300, // 300 requests / 15 min / IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) =>
    req.path === '/api/health' ||
    req.path.startsWith('/api/sensor') ||
    req.path.startsWith('/api/iot-data'),
  handler: tooManyHandler(
    'Too many requests. Please slow down and try again in a few minutes.'
  ),
});

// ============================================================
// AUTH LIMITER — strict, brute-force protection for
// login / register / password-reset endpoints.
// ============================================================
const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 20, // 20 attempts / 15 min / IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyHandler(
    'Too many login attempts. Please wait a few minutes and try again.'
  ),
});

// ============================================================
// SENSOR LIMITER — generous, IoT devices post frequently.
// Still capped so a malfunctioning/flooding device can't
// take the server down.
// ============================================================
const sensorLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 1000, // 1000 posts / 15 min / IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyHandler(
    'Too many device requests. Backing off briefly.'
  ),
});

module.exports = {
  apiLimiter,
  authLimiter,
  sensorLimiter,
};
