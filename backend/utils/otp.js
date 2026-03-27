import crypto from 'crypto';

/**
 * Generate a 6-digit numeric OTP.
 * @returns {string} e.g. "482917"
 */
const generateOTP = () => {
  // Generate a cryptographically secure 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

export { generateOTP };
