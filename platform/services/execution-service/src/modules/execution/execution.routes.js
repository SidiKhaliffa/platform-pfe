const router    = require('express').Router();
const ctrl      = require('./execution.controller');
const authorize = require('../../middlewares/authorize');
const { validate, installSchema, credentialSchema, jobFilterSchema } = require('./execution.validator');

// Catalogue — accessible à tous les rôles authentifiés
router.get('/catalog', ctrl.getCatalog);

// Credentials SSH — ADMIN uniquement (données sensibles)
router.post(  '/credentials',           authorize('ADMIN'), validate(credentialSchema),  ctrl.saveCredential);
router.get(   '/credentials/:serverId', authorize('ADMIN'),                               ctrl.getCredential);
router.delete('/credentials/:serverId', authorize('ADMIN'),                               ctrl.deleteCredential);

// Déclencher une installation — ADMIN, OPERATOR
router.post('/install', authorize('ADMIN', 'OPERATOR'), validate(installSchema), ctrl.install);

// Lire les jobs — tous les rôles authentifiés
router.get('/jobs',     validate(jobFilterSchema, 'query'), ctrl.listJobs);
router.get('/jobs/:id', ctrl.getJob);

module.exports = router;
