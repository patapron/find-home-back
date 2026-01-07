const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const logger = require('../config/logger');

/**
 * Middleware para verificar JWT y autenticar usuario
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('No se proporcionó token de autenticación');
      error.statusCode = 401;
      return next(error);
    }

    // Extraer token
    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 401;
      return next(error);
    }

    if (!user.isActive) {
      const error = new Error('Usuario inactivo');
      error.statusCode = 401;
      return next(error);
    }

    // Añadir usuario al request
    req.user = user;

    next();
  } catch (error) {
    logger.error('Error en autenticación', { error: error.message });
    next(error);
  }
};

/**
 * Middleware para verificar que el usuario sea admin
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    const error = new Error('Acceso denegado. Se requieren permisos de administrador');
    error.statusCode = 403;
    next(error);
  }
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // No fallar si el token es inválido, simplemente continuar sin usuario
    next();
  }
};

module.exports = { authenticate, isAdmin, optionalAuth };
