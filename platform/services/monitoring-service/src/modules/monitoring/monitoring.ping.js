const ping = require('ping');

const pingHost = async (ipAddress) => {
  const result = await ping.promise.probe(ipAddress, { timeout: 5 });
  if (result.alive) {
    const latencyMs = result.time !== 'unknown' ? Math.round(parseFloat(result.time)) : null;
    return { status: 'UP', latencyMs };
  }
  return { status: 'DOWN', latencyMs: null };
};

module.exports = { pingHost };
