const crypto = require('crypto');

const OTP_TTL_MINUTES = 10;
const RESET_TOKEN_TTL_MINUTES = 30;

/** Generates a 6-digit numeric OTP as a string, e.g. "042817". */
function generateOtp() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

/** Generates a URL-safe random token for password reset links. */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes an OTP or reset token for storage. sha256 (not bcrypt) is
 * appropriate here because these are high-entropy, machine-generated
 * random values, not low-entropy user-chosen passwords - a fast hash is
 * both sufficient and avoids unnecessary latency on every verification.
 */
function hashSecret(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = {
  OTP_TTL_MINUTES,
  RESET_TOKEN_TTL_MINUTES,
  generateOtp,
  generateResetToken,
  hashSecret,
  minutesFromNow,
};
