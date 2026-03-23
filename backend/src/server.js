/**
 * server.js — HTTP server entry point (no Express logic here)
 *
 * Responsibilities:
 *  1. Load environment variables
 *  2. Import the configured Express app
 *  3. Bind to port and start listening
 *  4. Handle OS-level process signals (SIGTERM, unhandledRejection)
 */

require('dotenv').config();

const app    = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

// ─── Start HTTP server ─────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in [${process.env.NODE_ENV}] mode on port ${PORT}`);
});

// Initialize WebSocket for real-time AI interviews
const initSocket = require('./socket');
const io = initSocket(server);

// ─── Graceful Shutdown: unhandled promise rejections ──────────────
process.on('unhandledRejection', (err) => {
  logger.error(`💥 Unhandled Rejection: ${err.name} — ${err.message}`);
  server.close(() => {
    logger.warn('Server closed after unhandledRejection. Exiting...');
    process.exit(1);
  });
});

// ─── Graceful Shutdown: uncaught sync exceptions ──────────────────
process.on('uncaughtException', (err) => {
  logger.error(`💥 Uncaught Exception: ${err.name} — ${err.message}`);
  process.exit(1);
});

// ─── Graceful Shutdown: SIGTERM (Docker / Heroku / Render) ────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
    process.exit(0);
  });
});

module.exports = server;
