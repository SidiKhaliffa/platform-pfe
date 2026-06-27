const cron = require('node-cron');
const { checkAll } = require('./monitoring.service');

let task = null;

const start = (cronExpr) => {
  if (!cronExpr) return;
  task = cron.schedule(cronExpr, async () => {
    console.log('[scheduler] Running scheduled health check');
    try {
      const results = await checkAll();
      console.log(`[scheduler] Checked ${results.length} server(s)`);
    } catch (err) {
      console.error('[scheduler] Error during scheduled check:', err.message);
    }
  });
  console.log(`[scheduler] Started — cron: "${cronExpr}"`);
};

const stop = () => task?.stop();

module.exports = { start, stop };
