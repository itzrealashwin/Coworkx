import AppError from '../utils/AppError.js';

/**
 * Validate request body against a Joi schema.
 * @param {import('joi').ObjectSchema} schema
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('. ');
      return next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }

    // Replace body with validated & sanitized values
    req.body = value;
    next();
  };
};

export default validate;
