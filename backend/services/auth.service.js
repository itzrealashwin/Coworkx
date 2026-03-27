import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import AppError from '../utils/AppError.js';
import { generateOTP } from '../utils/otp.js';
import { sendOTPEmail } from '../utils/email.js';
import { verifyGoogleToken } from '../config/google.js';
import { verifyGitHubToken } from '../config/github.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyRefreshToken,
  verifyResetToken,
} from '../utils/token.js';

// ────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS    = 30 * 60 * 1000; // 30 minutes
const OTP_EXPIRY_MS       = 5  * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS    = 3;
const MAX_SESSIONS        = 5;              // max active sessions per user

// OTP purpose constants — matches our otp_verifications.purpose column
const OTP_PURPOSE = {
  EMAIL_VERIFY  : 'email_verify',
  ADMIN_LOGIN   : 'admin_login',
  PASSWORD_RESET: 'reset',         // Changed from 'password_reset' to 'reset'
};

// ────────────────────────────────────────────────────────────
// 1. REGISTER
// ────────────────────────────────────────────────────────────
const register = async ({ displayName, email, password }) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user + UserCredential in a transaction
  // password lives in user_credentials table NOT users table
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        displayName : displayName,
        email,
        username    : await _generateUniqueUsername(email),
        isVerified  : false,
        isActive    : true,
      },
    });

    // user_credentials stores password separately
    await tx.userCredential.create({
      data: {
        userId      : newUser.id,
        passwordHash,
        failedLoginAttempts: 0,
      },
    });

    return newUser;
  });

  // Send email verification OTP
  await _createAndSendOTP(user.id, email, OTP_PURPOSE.EMAIL_VERIFY);

  return {
    message: 'Registration successful. Please check your email for the verification code.',
  };
};

// ────────────────────────────────────────────────────────────
// 2. VERIFY OTP
// Handles: email_verify, admin_login
// For admin_login → issues tokens after OTP confirmed
// ────────────────────────────────────────────────────────────
const verifyOtp = async ({ email, otp, req }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('No account found with this email.', 404, 'USER_NOT_FOUND');
  }

  // Find latest valid OTP — checks otp_verifications table
  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      userId    : user.id,
      verifiedAt: null,                    // NULL = not yet used (replaces isUsed)
      expiresAt : { gt: new Date() },
      purpose   : {
        in: [OTP_PURPOSE.EMAIL_VERIFY, OTP_PURPOSE.ADMIN_LOGIN],
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw new AppError(
      'OTP has expired or does not exist. Please request a new one.',
      400,
      'OTP_EXPIRED'
    );
  }

  // Check max attempts
  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.otpVerification.delete({ where: { id: otpRecord.id } });
    throw new AppError(
      'Too many incorrect attempts. Please request a new OTP.',
      400,
      'OTP_MAX_ATTEMPTS'
    );
  }

  // Compare OTP — field is otpHash not otp
  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) {
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data : { attempts: { increment: 1 } },
    });
    const remaining = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
    throw new AppError(
      `Invalid OTP. ${remaining} attempt(s) remaining.`,
      400,
      'INVALID_OTP'
    );
  }

  // Mark OTP as verified — set verifiedAt instead of isUsed
  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data : { verifiedAt: new Date() },
  });

  // EMAIL VERIFY PURPOSE → just verify email, no tokens
  if (otpRecord.purpose === OTP_PURPOSE.EMAIL_VERIFY) {
    await prisma.user.update({
      where: { id: user.id },
      data : { isVerified: true },       // isVerified not isEmailVerified
    });
    return { message: 'Email verified successfully.' };
  }

  // ADMIN LOGIN PURPOSE → issue tokens and create session
  if (otpRecord.purpose === OTP_PURPOSE.ADMIN_LOGIN) {
    const { accessToken, refreshToken } = await _createSession(user, req);
    return { accessToken, refreshToken, user: _sanitizeUser(user) };
  }
};

// ────────────────────────────────────────────────────────────
// 2a. RESEND OTP
// ────────────────────────────────────────────────────────────
const resendOtp = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('No account found with this email.', 404, 'USER_NOT_FOUND');
  }

  if (user.isVerified) {
    throw new AppError('Email is already verified.', 400, 'EMAIL_ALREADY_VERIFIED');
  }

  await _createAndSendOTP(user.id, email, OTP_PURPOSE.EMAIL_VERIFY);

  return { message: 'A new verification code has been sent to your email.' };
};

// ────────────────────────────────────────────────────────────
// 3. LOGIN (email + password)
// Does NOT return tokens here — sends OTP instead
// Tokens are issued in verifyOtp after OTP is confirmed
// ────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isVerified: true,
      isActive: true,

      oauthProviders: {
        select: { provider: true }
      },

      credential: {
        select: {
          passwordHash: true,
          failedLoginAttempts: true,
          lockUntil: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "Account is disabled.",
      403,
      "ACCOUNT_DISABLED"
    );
  }

  if (!user.isVerified) {
    throw new AppError(
      "Email not verified.",
      403,
      "EMAIL_NOT_VERIFIED"
    );
  }

  const providers = new Set(user.oauthProviders.map(p => p.provider));

  if (!user.credential && providers.has("google")) {
    throw new AppError(
      "This email is registered with Google login.",
      409,
      "PROVIDER_MISMATCH"
    );
  }

  if (!user.credential && providers.has("github")) {
    throw new AppError(
      "This email is registered with GitHub login.",
      409,
      "PROVIDER_MISMATCH"
    );
  }

  if (user.credential?.lockUntil && user.credential.lockUntil > new Date()) {
    throw new AppError(
      "Account locked due to multiple failed attempts.",
      423,
      "ACCOUNT_LOCKED"
    );
  }

  const isMatch = await bcrypt.compare(
    password,
    user.credential.passwordHash
  );

  if (!isMatch) {

    const newAttempts = user.credential.failedLoginAttempts + 1;

    await prisma.userCredential.update({
      where: { userId: user.id },
      data: { failedLoginAttempts: newAttempts }
    });

    throw new AppError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  // reset attempts
  await prisma.userCredential.update({
    where: { userId: user.id },
    data: {
      failedLoginAttempts: 0,
      lockUntil: null
    }
  });

  const accessToken = generateAccessToken({
    userId: user.id
  });

  const refreshToken = generateRefreshToken({
    userId: user.id
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl
    }
  };
};

// ────────────────────────────────────────────────────────────
// 4. GOOGLE LOGIN
// ────────────────────────────────────────────────────────────
const googleLogin = async ({ idToken }, req) => {
  let googlePayload;
  try {
    googlePayload = await verifyGoogleToken(idToken);
  } catch {
    throw new AppError('Invalid Google token.', 401, 'INVALID_GOOGLE_TOKEN');
  }

  const { email, name, picture, googleId } = googlePayload;

  let user;

  // Check if this Google account is already linked
  const providerRecord = await prisma.userOAuthProvider.findUnique({
    where: {
      provider_providerUserId: { provider: 'google', providerUserId: googleId },
    },
    include: { user: true },
  });

  if (providerRecord) {
    user = providerRecord.user;
  } else {
    const existingUser = await prisma.user.findUnique({
      where  : { email },
      include: {
        oauthProviders: { select: { provider: true } },
        credential    : { select: { passwordHash: true } },
      },
    });

    // If user has a password, they registered locally
    if (existingUser?.credential?.passwordHash) {
      throw new AppError(
        'Email already registered with password. Please log in with email/password.',
        409,
        'PROVIDER_MISMATCH'
      );
    }

    if (existingUser) {
      user = existingUser;
    } else {
      // Create new user — no UserCredential for OAuth users
      user = await prisma.user.create({
        data: {
          displayName: name,
          email,
          avatarUrl  : picture,
          isVerified : true,              // Google accounts are pre-verified
          isActive   : true,
          username   : await _generateUniqueUsername(email),
        },
      });
    }

    // Link Google provider in user_oauth_providers
    await prisma.userOAuthProvider.upsert({
      where : {
        provider_providerUserId: { provider: 'google', providerUserId: googleId },
      },
      create: {
        userId            : user.id,
        provider          : 'google',
        providerUserId    : googleId,
        providerEmail     : email,
        providerUsername  : email.split('@')[0],
        providerAvatarUrl : picture,
        isPrimary         : true,
      },
      update: {
        providerEmail    : email,
        providerAvatarUrl: picture,
      },
    });
  }

  // Update avatar/name if missing
  await prisma.user.update({
    where: { id: user.id },
    data : {
      avatarUrl  : user.avatarUrl   || picture,
      displayName: user.displayName || name,
      isVerified : true,
    },
  });

  // Create session and issue tokens
  const { accessToken, refreshToken } = await _createSession(user, req);

  return { accessToken, refreshToken, user: _sanitizeUser(user) };
};

// ────────────────────────────────────────────────────────────
// 4b. GITHUB LOGIN
// ────────────────────────────────────────────────────────────
const githubLogin = async ({ accessToken: ghAccessToken }, req) => {
  let githubPayload;
  try {
    githubPayload = await verifyGitHubToken(ghAccessToken);
  } catch {
    throw new AppError('Invalid GitHub access token.', 401, 'INVALID_GITHUB_TOKEN');
  }

  const { email, name, avatarUrl, githubId, username } = githubPayload;

  let user;

  const providerRecord = await prisma.userOAuthProvider.findUnique({
    where: {
      provider_providerUserId: { provider: 'github', providerUserId: githubId },
    },
    include: { user: true },
  });

  if (providerRecord) {
    user = providerRecord.user;
  } else {
    const existingUser = await prisma.user.findUnique({
      where  : { email },
      include: {
        oauthProviders: { select: { provider: true } },
        credential    : { select: { passwordHash: true } },
      },
    });

    if (existingUser?.credential?.passwordHash) {
      throw new AppError(
        'Email already registered with password. Please log in with email/password.',
        409,
        'PROVIDER_MISMATCH'
      );
    }

    if (existingUser) {
      user = existingUser;
    } else {
      user = await prisma.user.create({
        data: {
          displayName: name,
          email,
          avatarUrl,
          isVerified : true,
          isActive   : true,
          username   : await _generateUniqueUsername(email),
        },
      });
    }

    // Link GitHub provider in user_oauth_providers
    await prisma.userOAuthProvider.upsert({
      where : {
        provider_providerUserId: { provider: 'github', providerUserId: githubId },
      },
      create: {
        userId           : user.id,
        provider         : 'github',
        providerUserId   : githubId,
        providerEmail    : email,
        providerUsername : username || email.split('@')[0],
        providerAvatarUrl: avatarUrl,
        isPrimary        : true,
      },
      update: {
        providerEmail    : email,
        providerUsername : username || email.split('@')[0],
        providerAvatarUrl: avatarUrl,
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data : {
      avatarUrl  : user.avatarUrl   || avatarUrl,
      displayName: user.displayName || name,
      isVerified : true,
    },
  });

  const { accessToken, refreshToken } = await _createSession(user, req);

  return { accessToken, refreshToken, user: _sanitizeUser(user) };
};

// ────────────────────────────────────────────────────────────
// 5. REFRESH TOKEN ROTATION
// ────────────────────────────────────────────────────────────
const refreshTokens = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    throw new AppError('Refresh token is required.', 401, 'REFRESH_TOKEN_MISSING');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Hash incoming token to find matching session — never store raw tokens
  const tokenHash = _hashToken(oldRefreshToken);

  const session = await prisma.userSession.findFirst({
    where: {
      userId          : decoded.userId,
      refreshTokenHash: tokenHash,
      revokedAt       : null,             // not revoked
      expiresAt       : { gt: new Date() },
    },
  });

  if (!session) {
    // Token reuse detected — revoke ALL sessions for this user
    await prisma.userSession.updateMany({
      where: { userId: decoded.userId },
      data : { revokedAt: new Date() },
    });
    throw new AppError(
      'Refresh token reuse detected. All sessions have been revoked.',
      401,
      'TOKEN_REUSE_DETECTED'
    );
  }

  // Rotate token — revoke old session, create new one
  const newRefreshToken = generateRefreshToken({ userId: decoded.userId });
  const newTokenHash    = _hashToken(newRefreshToken);
  const accessToken     = generateAccessToken({ userId: decoded.userId });

  await prisma.$transaction([
    // Revoke old session
    prisma.userSession.update({
      where: { id: session.id },
      data : { revokedAt: new Date() },
    }),
    // Create new session
    prisma.userSession.create({
      data: {
        userId          : decoded.userId,
        refreshTokenHash: newTokenHash,
        expiresAt       : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        lastUsedAt      : new Date(),
      },
    }),
  ]);

  return { accessToken, refreshToken: newRefreshToken };
};

// ────────────────────────────────────────────────────────────
// 6. LOGOUT
// ────────────────────────────────────────────────────────────
const logout = async (userId, refreshToken) => {
  if (refreshToken) {
    const tokenHash = _hashToken(refreshToken);

    // Revoke this specific session — soft delete via revokedAt
    await prisma.userSession.updateMany({
      where: { userId, refreshTokenHash: tokenHash },
      data : { revokedAt: new Date() },
    });
  }

  return { message: 'Logged out successfully.' };
};

// ────────────────────────────────────────────────────────────
// 7. FORGOT PASSWORD — send OTP
// ────────────────────────────────────────────────────────────
const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({
    where  : { email },
    include: {
      oauthProviders: { select: { provider: true } },
      credential    : { select: { passwordHash: true } },
    },
  });

  // Always return same message to prevent email enumeration
  if (!user) {
    return {
      message: 'If an account exists with this email, a password reset OTP has been sent.',
    };
  }

  const linkedProviders = _getLinkedProviders(user);

  if (!user.credential?.passwordHash && linkedProviders.has('google')) {
    throw new AppError(
      'This account uses Google sign-in. Password reset is not applicable.',
      400,
      'GOOGLE_PROVIDER_NO_RESET'
    );
  }

  if (!user.credential?.passwordHash && linkedProviders.has('github')) {
    throw new AppError(
      'This account uses GitHub sign-in. Password reset is not applicable.',
      400,
      'GITHUB_PROVIDER_NO_RESET'
    );
  }

  await _createAndSendOTP(user.id, email, OTP_PURPOSE.PASSWORD_RESET);

  return {
    message: 'If an account exists with this email, a password reset OTP has been sent.',
  };
};

// ────────────────────────────────────────────────────────────
// 7b. VERIFY RESET OTP — returns reset token
// ────────────────────────────────────────────────────────────
const verifyResetOtp = async ({ email, otp }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('No account found with this email.', 404, 'USER_NOT_FOUND');
  }

  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      userId    : user.id,
      purpose   : OTP_PURPOSE.PASSWORD_RESET,
      verifiedAt: null,
      expiresAt : { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw new AppError(
      'OTP has expired or does not exist. Please request a new one.',
      400,
      'OTP_EXPIRED'
    );
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.otpVerification.delete({ where: { id: otpRecord.id } });
    throw new AppError(
      'Too many incorrect attempts. Please request a new OTP.',
      400,
      'OTP_MAX_ATTEMPTS'
    );
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) {
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data : { attempts: { increment: 1 } },
    });
    const remaining = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
    throw new AppError(
      `Invalid OTP. ${remaining} attempt(s) remaining.`,
      400,
      'INVALID_OTP'
    );
  }

  // Mark as verified
  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data : { verifiedAt: new Date() },
  });

  const resetToken = generateResetToken({ userId: user.id });

  return {
    resetToken,
    message: 'OTP verified. Use the reset token to set a new password.',
  };
};

// ────────────────────────────────────────────────────────────
// 7c. RESET PASSWORD
// ────────────────────────────────────────────────────────────
const resetPassword = async ({ resetToken, newPassword }) => {
  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch {
    throw new AppError('Invalid or expired reset token.', 401, 'INVALID_RESET_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    // Update password in user_credentials — not users table
    prisma.userCredential.update({
      where: { userId: user.id },
      data : {
        passwordHash,
        passwordChangedAt  : new Date(),
        failedLoginAttempts: 0,
        lockUntil          : null,
      },
    }),
    // Revoke all sessions on password reset
    prisma.userSession.updateMany({
      where: { userId: user.id },
      data : { revokedAt: new Date() },
    }),
  ]);

  return { message: 'Password reset successfully. Please log in with your new password.' };
};

// ────────────────────────────────────────────────────────────
// 8. GET CURRENT USER
// ────────────────────────────────────────────────────────────
const getMe = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }
  return { user: _sanitizeUser(user) };
};

// ────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ────────────────────────────────────────────────────────────

/**
 * Hash a token using SHA-256.
 * Used for refresh tokens — never store raw tokens in DB.
 */
const _hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Create a new session in user_sessions table.
 * Max 5 sessions — deletes oldest if exceeded.
 */
const _createSession = async (user, req) => {
  const accessToken  = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });
  const tokenHash    = _hashToken(refreshToken);

  // Enforce max sessions — delete oldest if at limit
  const sessionCount = await prisma.userSession.count({
    where: { userId: user.id, revokedAt: null },
  });

  if (sessionCount >= MAX_SESSIONS) {
    const oldest = await prisma.userSession.findFirst({
      where  : { userId: user.id, revokedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (oldest) {
      await prisma.userSession.update({
        where: { id: oldest.id },
        data : { revokedAt: new Date() },
      });
    }
  }

  // Create new session row
  await prisma.userSession.create({
    data: {
      userId          : user.id,
      refreshTokenHash: tokenHash,
      ipAddress       : req?.ip       || null,
      userAgent       : req?.headers?.['user-agent'] || null,
      expiresAt       : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      lastUsedAt      : new Date(),
    },
  });

  // Update lastSeenAt on users table
  await prisma.user.update({
    where: { id: user.id },
    data : { lastSeenAt: new Date() },
  });

  return { accessToken, refreshToken };
};

/**
 * Create OTP, save hashed to otp_verifications, send via email.
 * Deletes any previous OTPs of same purpose for this user.
 */
const _createAndSendOTP = async (userId, email, purpose) => {
  // Invalidate previous OTPs of same purpose
  await prisma.otpVerification.deleteMany({
    where: { userId, purpose },
  });

  const otpCode = generateOTP();
  const otpHash = await bcrypt.hash(otpCode, 10);

await prisma.otpVerification.create({
    data: {
      userId,
      otpHash,
      purpose,
      // REMOVE THIS: attempts: MAX_OTP_ATTEMPTS, 
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    },
  });

  await sendOTPEmail(email, otpCode, purpose);
};

/**
 * Return a user object safe for client consumption.
 * Strips any sensitive fields.
 */
const _sanitizeUser = (user) => {
  const { deletedAt, ...sanitized } = user;
  return sanitized;
};

/**
 * Build a Set of linked OAuth providers for a user.
 */
const _getLinkedProviders = (user) => {
  return new Set(
    (user.oauthProviders || []).map((p) => p.provider?.toLowerCase())
  );
};

/**
 * Generate a unique username from email.
 */
const _generateUniqueUsername = async (email) => {
  const base = email
    .split('@')[0]
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 30) || 'user';

  for (let i = 0; i < 20; i++) {
    const suffix    = Math.floor(1000 + Math.random() * 9000).toString();
    const candidate = `${base}_${suffix}`.slice(0, 50);
    const exists    = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
  }

  throw new AppError(
    'Unable to generate a unique username. Please try again.',
    500,
    'USERNAME_GENERATION_FAILED'
  );
};

export default {
  register,
  verifyOtp,
  resendOtp,
  login,
  googleLogin,
  githubLogin,
  refreshTokens,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getMe,
};