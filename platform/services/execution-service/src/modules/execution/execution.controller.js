const asyncHandler = require('../../middlewares/asyncHandler');
const service      = require('./execution.service');

// GET /api/execution/catalog
const getCatalog = asyncHandler(async (req, res) => {
  const items = service.getCatalog();
  res.json(items);
});

// POST /api/execution/credentials
const saveCredential = asyncHandler(async (req, res) => {
  const credential = await service.saveCredential(req.body);
  const { secretEncrypted: _, ...safe } = credential;
  res.status(201).json(safe);
});

// GET /api/execution/credentials/:serverId
const getCredential = asyncHandler(async (req, res) => {
  const info = await service.getCredentialInfo(req.params.serverId);
  res.json(info);
});

// DELETE /api/execution/credentials/:serverId
const deleteCredential = asyncHandler(async (req, res) => {
  await service.removeCredential(req.params.serverId);
  res.status(204).end();
});

// POST /api/execution/install
const install = asyncHandler(async (req, res) => {
  const requestedBy = req.headers['x-user-id'] || 'unknown';
  const job = await service.requestInstall({ ...req.body, requestedBy });
  res.status(202).json({
    jobId:   job.id,
    status:  job.status,
    message: 'Installation job queued — follow progress with GET /api/execution/jobs/' + job.id,
  });
});

// GET /api/execution/jobs
const listJobs = asyncHandler(async (req, res) => {
  const jobs = await service.listJobs(req.query);
  res.json(jobs);
});

// GET /api/execution/jobs/:id
const getJob = asyncHandler(async (req, res) => {
  const job = await service.getJob(req.params.id);
  res.json(job);
});

module.exports = { getCatalog, saveCredential, getCredential, deleteCredential, install, listJobs, getJob };
