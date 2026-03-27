import AppError from '../utils/AppError.js';

/**
 * Central error-handling middleware.
 * All errors flow through here — controllers NEVER handle errors directly.
 */
const errorHandler = (err, req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Prisma validation error
  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided.';
    code = 'VALIDATION_ERROR';
  }

  // Prisma unique constraint violation (e.g. duplicate email)
  if (err.code === 'P2002') {
    statusCode = 409;
    const fields = err.meta?.target?.join(', ') || 'unknown field';
    message = `Duplicate value for field: ${fields}. Please use another value.`;
    code = 'DUPLICATE_KEY';
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    message = err.meta?.cause || 'Record not found.';
    code = 'NOT_FOUND';
  }

  // JWT errors (fallback)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please log in again.';
    code = 'TOKEN_EXPIRED';
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', {
      statusCode,
      message,
      code,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
