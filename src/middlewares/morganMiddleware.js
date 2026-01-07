const morgan = require('morgan');
const logger = require('../config/logger');

// Stream para redirigir logs de Morgan a Winston
const stream = {
  write: (message) => logger.http(message.trim()),
};

// Formato de log
const morganFormat = process.env.NODE_ENV === 'production'
  ? 'combined'
  : ':method :url :status :res[content-length] - :response-time ms';

// Middleware de Morgan
const morganMiddleware = morgan(morganFormat, { stream });

module.exports = morganMiddleware;
