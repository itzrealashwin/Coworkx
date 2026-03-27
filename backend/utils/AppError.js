/**
 * Custom application error class.
 * Thrown by services, caught by the central error-handling middleware.
 */
class AppError extends Error {
  /**
   * @param {string} message — human-readable error message
   * @param {number} statusCode — HTTP status code
   * @param {string} [code] — machine-readable error code constant
   */
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
