import { verifyAccessToken } from '../utils/token.js';
import { prisma } from '../config/db.js';
import AppError from '../utils/AppError.js';

/**
 * Protect middleware — verifies JWT access token and attaches req.user.
 * Checks token version to support global session invalidation.
 */
const protect = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401, 'AUTH_REQUIRED');
    }

    // Verify the token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Access token has expired. Please refresh.', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid access token.', 401, 'INVALID_TOKEN');
    }

    // Find user and check token version
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated.', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Token version check — enables instant global logout
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new AppError(
        'Token has been invalidated. Please log in again.',
        401,
        'TOKEN_VERSION_MISMATCH'
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware — restricts to specific roles.
 * @param  {...string} roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action.',
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

export { protect, authorizeRoles };
