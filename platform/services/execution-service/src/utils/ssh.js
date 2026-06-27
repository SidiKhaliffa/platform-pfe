const { Client } = require('ssh2');
const logger = require('./logger');

const CMD_TIMEOUT_MS = 5 * 60 * 1000; // 5 min max par commande

// Exécute une seule commande sur un canal SSH ouvert, renvoie { out, code }
function execOne(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = `$ ${cmd}\n`;
      stream.on('data',        (d) => { out += d.toString(); });
      stream.stderr.on('data', (d) => { out += d.toString(); });
      stream.on('close', (code) => resolve({ out, code }));
    });
  });
}

function withTimeout(promise, ms, label) {
  const timer = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout (${ms / 1000}s): ${label}`)), ms)
  );
  return Promise.race([promise, timer]);
}

/**
 * Se connecte en SSH et exécute une suite de commandes en séquence.
 * Arrête dès qu'une commande retourne un code de sortie non nul.
 *
 * @param {string}  host       IP ou hostname cible
 * @param {number}  port       Port SSH (défaut 22)
 * @param {string}  sshUser    Utilisateur SSH
 * @param {object}  authConfig { password } ou { privateKey }
 * @param {string[]} commands  Commandes à exécuter dans l'ordre
 * @returns {Promise<string>}  Sortie complète accumulée (stdout + stderr)
 * @throws {Error} avec propriété .output = sortie partielle avant l'échec
 */
async function runCommands(host, port, sshUser, authConfig, commands) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', async () => {
      let fullOutput = '';
      try {
        for (const cmd of commands) {
          const { out, code } = await withTimeout(execOne(conn, cmd), CMD_TIMEOUT_MS, cmd);
          fullOutput += out + '\n';
          if (code !== 0) {
            conn.end();
            const err = new Error(`Command failed (exit ${code}): ${cmd}`);
            err.output  = fullOutput;
            err.exitCode = code;
            return reject(err);
          }
        }
        conn.end();
        resolve(fullOutput);
      } catch (err) {
        conn.end();
        if (!err.output) err.output = fullOutput;
        reject(err);
      }
    });

    conn.on('error', (err) => {
      const wrapped = new Error(`SSH connection error: ${err.message}`);
      wrapped.output = '';
      reject(wrapped);
    });

    conn.connect({
      host,
      port:         port || 22,
      username:     sshUser,
      readyTimeout: 15000,
      ...authConfig,
    });

    logger.debug('SSH connecting', { host, port, sshUser });
  });
}

module.exports = { runCommands };
