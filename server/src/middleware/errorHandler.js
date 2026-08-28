import config from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  console.error(`❌ [Error Handler] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: config.isDev ? err.stack : undefined
  });
}

export function notFoundHandler(req, res, next) {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export default {
  errorHandler,
  notFoundHandler
};
