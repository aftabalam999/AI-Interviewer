/**
 * server.js — HTTP server entry point (no Express logic here)
 *
 * Responsibilities:
 *  1. Load environment variables
 *  2. Import the configured Express app
 *  3. Bind to port and start listening
 *  4. Handle OS-level process signals (SIGTERM, unhandledRejection)
 */

require('dotenv').config({ override: true });
console.log('SERVER APP ID:', process.env.ADZUNA_APP_ID);
console.log('SERVER APP KEY:', process.env.ADZUNA_APP_KEY);

const app = require('./app');
const logger = require('./config/logger');

const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

// ─── Start HTTP server ─────────────────────────────────────────────
const server = app.listen(PORT, async () => {
  logger.info(`🚀 Server running in [${process.env.NODE_ENV}] mode on port ${PORT}`);
  
  // Initialize automatic job scraper scheduler and other DB-dependent services
  const initDbDependentServices = async () => {
    try {
      // If mongoose is still connecting (readyState === 2), wait for it to connect
      if (mongoose.connection.readyState === 2) {
        logger.info('⏳ Waiting for MongoDB connection before initializing schedulers...');
        await new Promise((resolve) => {
          mongoose.connection.once('connected', resolve);
        });
      }
      
      if (mongoose.connection.readyState === 1) {
        logger.info('⚙️ Initializing schedulers after MongoDB connection...');
        // Initialize scraper
        try {
          const { initScraperScheduler } = require('./controllers/adminScraper.controller');
          await initScraperScheduler();
        } catch (err) {
          logger.error(`❌ Job Scraper scheduler failure: ${err.message}`);
        }
        
        // Initialize other background services
        try {
          const { initSyncScheduler } = require('./services/jobSyncScheduler');
          const { initCleanupScheduler } = require('./services/jobCleanupService');
          initSyncScheduler();
          initCleanupScheduler();
          logger.info('🚀 Background services (Sync & Cleanup) initialized successfully');
        } catch (err) {
          logger.error(`❌ Background services initialization failure: ${err.message}`);
        }
      } else {
        logger.warn('⚠️ MongoDB is not connected. Schedulers will not be initialized.');
      }
    } catch (err) {
      logger.error(`❌ Database-dependent services startup failure: ${err.message}`);
    }
  };
  
  await initDbDependentServices();
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
