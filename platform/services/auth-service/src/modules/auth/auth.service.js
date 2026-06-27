const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const repo    = require('./auth.repository');
const { jwtSecret, jwtExpiresIn } = require('../../config/env');

const SALT_ROUNDS = 10;

// Ne jamais renvoyer le hash du password au client
const strip = ({ password, ...user }) => user;

const register = async ({ email, password }) => {
  const existing = await repo.findByEmail(email);
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  // Tout nouvel utilisateur enregistré est VIEWER — l'ADMIN est créé via seed
  const user = await repo.create({ email, password: hashed, role: 'VIEWER' });
  return strip(user);
};

const login = async ({ email, password }) => {
  const user  = await repo.findByEmail(email);
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  // Payload JWT : sub = userId, role = rôle RBAC
  const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
  return { token, user: strip(user) };
};

const me = async (userId) => {
  const user = await repo.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return strip(user);
};

module.exports = { register, login, me };
