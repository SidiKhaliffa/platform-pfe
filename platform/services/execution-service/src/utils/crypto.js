const crypto = require('crypto');
const { encryptionKey } = require('../config/env');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(encryptionKey, 'hex'); // 32 bytes

const encrypt = (plaintext) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  // Format stocké : "<iv_hex>:<ciphertext_hex>"
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (stored) => {
  const [ivHex, encHex] = stored.split(':');
  const iv        = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher  = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};

module.exports = { encrypt, decrypt };
