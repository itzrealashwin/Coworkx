import Joi from 'joi';

const registerSchema = Joi.object({
  displayName: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty'  : 'Display name is required',
    'string.max'    : 'Display name cannot exceed 100 characters',
    'any.required'  : 'Display name is required',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email'  : 'Please provide a valid email address',
    'any.required'  : 'Email is required',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min'    : 'Password must be at least 8 characters',
    'string.max'    : 'Password cannot exceed 128 characters',
    'any.required'  : 'Password is required',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email'  : 'Please provide a valid email address',
    'any.required'  : 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required'  : 'Password is required',
  }),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email'  : 'Please provide a valid email address',
    'any.required'  : 'Email is required',
  }),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length'       : 'OTP must be 6 digits',
    'string.pattern.base' : 'OTP must contain only numbers',
    'any.required'        : 'OTP is required',
  }),
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email'  : 'Please provide a valid email address',
    'any.required'  : 'Email is required',
  }),
});

const googleAuthSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'any.required'  : 'Google ID token is required',
  }),
});

const githubAuthSchema = Joi.object({
  accessToken: Joi.string().required().messages({
    'any.required'  : 'GitHub access token is required',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email'  : 'Please provide a valid email address',
    'any.required'  : 'Email is required',
  }),
});

// verifyResetOtp uses same shape as verifyOtpSchema (email + otp)
// kept as a separate export for clarity at the route level
const verifyResetOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email'  : 'Please provide a valid email address',
    'any.required'  : 'Email is required',
  }),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length'       : 'OTP must be 6 digits',
    'string.pattern.base' : 'OTP must contain only numbers',
    'any.required'        : 'OTP is required',
  }),
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required().messages({
    'any.required'  : 'Reset token is required',
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.min'    : 'Password must be at least 8 characters',
    'string.max'    : 'Password cannot exceed 128 characters',
    'any.required'  : 'New password is required',
  }),
});

export {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  verifyResetOtpSchema,
  resendOtpSchema,
  googleAuthSchema,
  githubAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};