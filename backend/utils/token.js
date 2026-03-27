import jwt from 'jsonwebtoken';

/**
 * Generate a JWT access token.
 * @param {{ userId: string, role: string, tokenVersion: number }} payload
 * @returns {string}
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  });
};

/**
 * Generate a JWT refresh token.
 * @param {{ userId: string }} payload
 * @returns {string}
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  });
};

/**
 * Generate a short-lived reset token.
 * @param {{ userId: string }} payload
 * @returns {string}
 */
const generateResetToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_RESET_SECRET, {
    expiresIn: '10m',
  });
};

/**
 * Verify an access token.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Verify a reset token.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyResetToken = (token) => {
  return jwt.verify(token, process.env.JWT_RESET_SECRET);
};

export {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetToken,
};
