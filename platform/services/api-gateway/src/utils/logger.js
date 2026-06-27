// Copie locale de shared/utils/logger.js — évite les problèmes de chemin Docker
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const current = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

const fmt = (level, msg, meta) =>
  JSON.stringify({ timestamp: new Date().toISOString(), level, service: 'api-gateway', message: msg, ...(meta && { meta }) });

const logger = {
  error: (msg, meta) => current >= LEVELS.error && console.error(fmt('error', msg, meta)),
  warn:  (msg, meta) => current >= LEVELS.warn  && console.warn(fmt('warn',  msg, meta)),
  info:  (msg, meta) => current >= LEVELS.info  && console.log(fmt('info',  msg, meta)),
  debug: (msg, meta) => current >= LEVELS.debug && console.log(fmt('debug', msg, meta)),
};

module.exports = logger;
