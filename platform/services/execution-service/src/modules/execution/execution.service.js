const repo            = require('./execution.repository');
const publisher       = require('../../utils/publisher');
const ssh             = require('../../utils/ssh');
const { encrypt, decrypt } = require('../../utils/crypto');
const inventoryClient = require('../../utils/inventoryClient');
const catalog         = require('../../config/catalog');
const logger          = require('../../utils/logger');

// ── Catalogue ─────────────────────────────────────────────────────────────────

const getCatalog = () => Object.values(catalog);

// ── Credentials SSH ───────────────────────────────────────────────────────────

const saveCredential = async ({ serverId, sshUser, host, port, authType, secret }) => {
  // Vérifie que le serveur existe dans inventory avant d'enregistrer
  const server = await inventoryClient.getServer(serverId);
  if (!server) {
    const err = new Error(`Server ${serverId} not found in inventory`);
    err.status = 404;
    throw err;
  }
  return repo.upsertCredential(serverId, {
    sshUser,
    host:            host || null,
    port:            port || 22,
    authType,
    secretEncrypted: encrypt(secret),
  });
};

const getCredentialInfo = async (serverId) => {
  const cred = await repo.findCredential(serverId);
  if (!cred) {
    const err = new Error(`No SSH credentials for server ${serverId}`);
    err.status = 404;
    throw err;
  }
  // Ne jamais renvoyer secretEncrypted au client
  const { secretEncrypted: _, ...safe } = cred;
  return safe;
};

const removeCredential = async (serverId) => {
  const cred = await repo.findCredential(serverId);
  if (!cred) {
    const err = new Error(`No SSH credentials for server ${serverId}`);
    err.status = 404;
    throw err;
  }
  return repo.deleteCredential(serverId);
};

// ── Jobs ──────────────────────────────────────────────────────────────────────

const requestInstall = async ({ serverId, softwareKey, requestedBy }) => {
  // Vérifie que la clé existe dans le catalogue (double-check en plus de Joi)
  if (!catalog[softwareKey]) {
    const err = new Error(`Software "${softwareKey}" not in catalog`);
    err.status = 404;
    throw err;
  }

  // Récupère l'IP et le hostname depuis inventory (dénormalisation au moment de la création)
  const server = await inventoryClient.getServer(serverId);
  if (!server) {
    const err = new Error(`Server ${serverId} not found in inventory`);
    err.status = 404;
    throw err;
  }

  const job = await repo.createJob({
    serverId,
    ipAddress:   server.ipAddress,
    hostname:    server.hostname,
    softwareKey,
    requestedBy,
  });

  // Publie l'événement — le worker va consommer et traiter le job
  publisher.publish('install.requested', {
    jobId:       job.id,
    serverId:    job.serverId,
    ipAddress:   job.ipAddress,
    hostname:    job.hostname,
    softwareKey: job.softwareKey,
  });

  logger.info('[service] Install job created', { jobId: job.id, serverId, softwareKey });
  return job;
};

const getJob = async (id) => {
  const job = await repo.findJobById(id);
  if (!job) {
    const err = new Error('Job not found');
    err.status = 404;
    throw err;
  }
  return job;
};

const listJobs = ({ status, serverId } = {}) =>
  repo.findJobs({ status, serverId });

// ── Worker (appelé par le consumer RabbitMQ) ──────────────────────────────────

const processInstallJob = async ({ jobId, serverId, ipAddress, softwareKey }) => {
  const job = await repo.findJobById(jobId);
  // Idempotence : si le job n'est plus PENDING, on ignore (ex: double delivery)
  if (!job || job.status !== 'PENDING') {
    logger.warn('[worker] Job not found or already processed', { jobId, status: job?.status });
    return;
  }

  const catalogEntry = catalog[softwareKey];
  if (!catalogEntry) {
    await repo.updateJob(jobId, { status: 'FAILED', errorMessage: `Unknown software key: ${softwareKey}` });
    return;
  }

  const credential = await repo.findCredential(serverId);
  if (!credential) {
    await repo.updateJob(jobId, {
      status: 'FAILED',
      errorMessage: `No SSH credentials for server ${serverId}. Register them via POST /api/execution/credentials.`,
    });
    publisher.publish('install.failed', { jobId, serverId, softwareKey, reason: 'no_credentials' });
    return;
  }

  await repo.updateJob(jobId, { status: 'RUNNING' });
  logger.info('[worker] Job started', { jobId, softwareKey, ipAddress });

  const secret     = decrypt(credential.secretEncrypted);
  const authConfig = credential.authType === 'KEY' ? { privateKey: secret } : { password: secret };
  // Si une surcharge de host est définie (ex: hostname Docker), on l'utilise
  const sshHost   = credential.host || ipAddress;
  const commands  = [...catalogEntry.installCommands, catalogEntry.verifyCommand];

  try {
    const output = await ssh.runCommands(sshHost, credential.port, credential.sshUser, authConfig, commands);
    await repo.updateJob(jobId, { status: 'SUCCESS', output });
    publisher.publish('install.completed', { jobId, serverId, softwareKey, hostname: job.hostname });
    logger.info('[worker] Job SUCCESS', { jobId, softwareKey });
  } catch (err) {
    await repo.updateJob(jobId, {
      status:       'FAILED',
      output:       err.output || '',
      errorMessage: err.message,
    });
    publisher.publish('install.failed', { jobId, serverId, softwareKey, reason: err.message });
    logger.error('[worker] Job FAILED', { jobId, softwareKey, error: err.message });
  }
};

module.exports = {
  getCatalog,
  saveCredential,
  getCredentialInfo,
  removeCredential,
  requestInstall,
  getJob,
  listJobs,
  processInstallJob,
};
