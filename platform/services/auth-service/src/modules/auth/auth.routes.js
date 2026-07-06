const { Router } = require('express');
const controller = require('./auth.controller');
const validate   = require('../../middlewares/validate');
const authorize  = require('../../middlewares/authorize');
const { registerSchema, loginSchema, createUserSchema } = require('./auth.validation');

const router = Router();

// Routes publiques (déclarées comme publicPaths dans la gateway)
router.post('/register', validate(registerSchema), controller.register);
router.post('/login',    validate(loginSchema),    controller.login);

// Route protégée : la gateway vérifie le JWT et injecte X-User-Id avant de proxifier
router.get('/me', controller.me);

// Gestion des comptes — ADMIN uniquement
router.get('/users',  authorize('ADMIN'), controller.listUsers);
router.post('/users', authorize('ADMIN'), validate(createUserSchema), controller.createUser);

module.exports = router;
