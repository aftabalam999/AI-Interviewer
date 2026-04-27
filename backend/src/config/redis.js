'use strict';

/**
 * redis.js — Redis client singleton (ioredis)
 *
 * ioredis uses a single multiplexed TCP connection (all commands share one
 * socket, pipelined automatically). This is equivalent to a connection pool
 * for most workloads.
 *
 * Connection pool / performance settings:
 *   enableOfflineQueue  false  — fail-fast, never queue when disconnected
 *   maxRetriesPerRequest 1     — surface errors quickly
 *   keepAlive           true   — TCP keepalive; prevents NAT/firewall drops
 *   connectTimeout      5 000ms
 *   commandTimeout      3 000ms
 *   retryStrategy       exponential backoff, max 10 retries
 *
 * Config (env vars):
 *   REDIS_URL        redis[s]://[:password@]host:port  (takes precedence)
 *   REDIS_HOST       default: 127.0.0.1
 *   REDIS_PORT       default: 6379
 *   REDIS_PASSWORD   optional
 *   REDIS_DB         default: 0
 *   REDIS_TLS        set to "true" for TLS (Redis Cloud / Upstash)
 *   REDIS_ENABLED    set to "false" to disable entirely (useful in CI)
 */

const Redis = require('ioredis');

const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';
const REDIS_TLS     = process.env.REDIS_TLS     === 'true';

// Exponential backoff retry: 50ms → 200ms → 800ms … cap at 5s, max 10 retries
function retryStrategy(times) {
  if (times > 10) {
    console.error('[Redis] Max reconnection attempts reached. Giving up.');
    return null; // stop retrying
  }
  const delay = Math.min(50 * Math.pow(2, times - 1), 5000);
  console.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${times})…`);
  return delay;
}

let client = null;

if (REDIS_ENABLED) {
  const baseOptions = {
    host               : process.env.REDIS_HOST     || '127.0.0.1',
    port               : parseInt(process.env.REDIS_PORT, 10) || 6379,
    password           : process.env.REDIS_PASSWORD  || undefined,
    db                 : parseInt(process.env.REDIS_DB, 10)   || 0,

    // ── Connection pooling / performance ────────────────────────────
    lazyConnect        : true,   // defer connection until first command
    enableOfflineQueue : false,  // reject commands immediately when down
    maxRetriesPerRequest: 1,     // surface errors fast, don't hang
    connectTimeout     : parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS, 10) || 5000,
    commandTimeout     : parseInt(process.env.REDIS_COMMAND_TIMEOUT_MS, 10) || 3000,

    // ── TCP keepalive ────────────────────────────────────────────────
    // Prevents NAT / cloud firewall from silently dropping idle sockets.
    // Value = ms between keepalive probes sent by the OS.
    keepAlive          : 10_000, // 10s
    family             : 4,      // force IPv4 — avoids dual-stack lookup delays

    // ── Retry strategy ───────────────────────────────────────────────
    retryStrategy,

    // ── TLS (Redis Cloud, Upstash, AWS ElastiCache in-transit) ───────
    ...(REDIS_TLS ? { tls: {} } : {}),
  };

  const connectionOptions = process.env.REDIS_URL
    ? (() => {
        // When using a URL, still layer in performance & TLS settings
        const url = new URL(process.env.REDIS_URL);
        return {
          host              : url.hostname,
          port              : parseInt(url.port, 10) || 6379,
          password          : url.password || undefined,
          db                : parseInt(url.pathname.slice(1), 10) || 0,
          ...baseOptions,
          // These override the URL-derived fields intentionally
          lazyConnect       : true,
          enableOfflineQueue: false,
        };
      })()
    : baseOptions;

  client = new Redis(connectionOptions);

  client.on('connect',      () => console.log('[Redis] Connected'));
  client.on('ready',        () => console.log('[Redis] Ready'));
  client.on('error',        (err) => console.warn('[Redis] Error:', err.message));
  client.on('close',        () => console.warn('[Redis] Connection closed'));
  client.on('reconnecting', () => console.log('[Redis] Reconnecting…'));
} else {
  console.log('[Redis] Disabled via REDIS_ENABLED=false');
}

/**
 * Returns the ioredis client, or null when Redis is disabled / not yet connected.
 * @returns {import('ioredis').Redis|null}
 */
function getClient() {
  return client;
}

/**
 * Gracefully disconnect (useful in tests / graceful shutdown).
 */
async function disconnect() {
  if (client) {
    await client.quit().catch(() => {});
    client = null;
  }
}

module.exports = { getClient, disconnect };
