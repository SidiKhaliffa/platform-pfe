const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

const format = (level, service, message, meta) =>
  JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...(meta !== undefined && { meta }),
  });

const createLogger = (service) => ({
  error: (msg, meta) => currentLevel >= LEVELS.error && console.error(format('error', service, msg, meta)),
  warn:  (msg, meta) => currentLevel >= LEVELS.warn  && console.warn(format('warn',  service, msg, meta)),
  info:  (msg, meta) => currentLevel >= LEVELS.info  && console.log(format('info',  service, msg, meta)),
  debug: (msg, meta) => currentLevel >= LEVELS.debug && console.log(format('debug', service, msg, meta)),
});

module.exports = { createLogger };
