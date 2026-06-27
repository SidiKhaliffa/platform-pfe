require('dotenv').config();

module.exports = {
  port:          parseInt(process.env.PORT || '3001', 10),
  jwtSecret:     process.env.JWT_SECRET,
  jwtExpiresIn:  process.env.JWT_EXPIRES_IN || '24h',
};
