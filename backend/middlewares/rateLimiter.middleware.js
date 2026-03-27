import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter — applies to all routes.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Auth-specific rate limiter — stricter limits for login/register/otp.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * OTP-specific rate limiter — max 3 OTP requests per hour.
 */
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 OTP requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again in an hour.',
    code: 'OTP_RATE_LIMIT_EXCEEDED',
  },
});

export { globalLimiter, authLimiter, otpLimiter };
