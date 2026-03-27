import { Router } from 'express';
import authController from '../controller/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  googleAuthSchema,
  githubAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public routes
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/google', authLimiter, validate(googleAuthSchema), authController.googleLogin);
router.post('/github', authLimiter, validate(githubAuthSchema), authController.githubLogin);
router.post('/refresh', authController.refresh);

// Forgot password flow
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-otp', authLimiter, validate(verifyOtpSchema), authController.verifyResetOtp);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

export default router;
