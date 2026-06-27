const authorize = (...roles) => (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (!roles.includes(role)) {
    return res.status(403).json({ error: { message: 'Insufficient permissions' } });
  }
  next();
};
module.exports = authorize;
