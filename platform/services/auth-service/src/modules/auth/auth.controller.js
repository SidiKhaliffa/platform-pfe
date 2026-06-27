const asyncHandler = require('../../middlewares/asyncHandler');
const service = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const user = await service.register(req.body);
  res.status(201).json(user);
});

const login = asyncHandler(async (req, res) => {
  const { token, user } = await service.login(req.body);
  res.json({ token, user });
});

// La gateway a déjà vérifié le JWT et injecte X-User-Id.
// Ce service fait confiance à ce header (réseau Docker interne uniquement).
const me = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  const user = await service.me(userId);
  res.json(user);
});

module.exports = { register, login, me };
