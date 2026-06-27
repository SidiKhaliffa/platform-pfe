const { Router } = require('express');
const controller = require('./auth.controller');
const validate   = require('../../middlewares/validate');
const { registerSchema, loginSchema } = require('./auth.validation');

const router = Router();

// Routes publiques (déclarées comme publicPaths dans la gateway)
router.post('/register', validate(registerSchema), controller.register);
router.post('/login',    validate(loginSchema),    controller.login);

// Route protégée : la gateway vérifie le JWT et injecte X-User-Id avant de proxifier
router.get('/me', controller.me);

module.exports = router;
