import authService from '../services/auth.service.js';

/**
 * Cookie options for the refresh token.
 */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// ─── POST /auth/register ─────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/verify-otp ───────────────────────────────────
const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/resend-otp ───────────────────────────────────
const resendOtp = async (req, res, next) => {
  try {
    const result = await authService.resendOtp(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/login ────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/google ──────────────────────────────────────
const googleLogin = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.googleLogin(req.body);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Google login successful.',
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/github ─────────────────────────────────────
const githubLogin = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.githubLogin(req.body);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'GitHub login successful.',
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/refresh ─────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;
    const { accessToken, refreshToken } = await authService.refreshTokens(oldRefreshToken);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed.',
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/logout ──────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    await authService.logout(req.user.id, refreshToken);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/forgot-password ─────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/verify-reset-otp ────────────────────────────
const verifyResetOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyResetOtp(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/reset-password ──────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /auth/me ────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  verifyOtp,
  resendOtp,
  login,
  googleLogin,
  githubLogin,
  refresh,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getMe,
};
