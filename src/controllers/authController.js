const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const logger = require('../config/logger');

/**
 * Generar JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * @desc    Registrar nuevo usuario
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('El email ya está registrado');
      error.statusCode = 400;
      return next(error);
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generar token
    const token = generateToken(user._id);

    logger.info('Nuevo usuario registrado', { userId: user._id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login de usuario
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar entrada
    if (!email || !password) {
      const error = new Error('Email y contraseña son requeridos');
      error.statusCode = 400;
      return next(error);
    }

    // Buscar usuario (incluir password)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      return next(error);
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      return next(error);
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      const error = new Error('Usuario inactivo');
      error.statusCode = 401;
      return next(error);
    }

    // Generar token
    const token = generateToken(user._id);

    logger.info('Usuario inició sesión', { userId: user._id, email: user.email });

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener usuario actual
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // req.user ya está disponible gracias al middleware authenticate
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar perfil de usuario
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      return next(error);
    }

    // Actualizar campos
    if (name) user.name = name;
    if (email) {
      // Verificar si el email ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        const error = new Error('El email ya está en uso');
        error.statusCode = 400;
        return next(error);
      }
      user.email = email;
    }

    await user.save();

    logger.info('Usuario actualizó su perfil', { userId: user._id });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cambiar contraseña
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      const error = new Error('Contraseña actual y nueva contraseña son requeridas');
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      return next(error);
    }

    // Verificar contraseña actual
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      const error = new Error('Contraseña actual incorrecta');
      error.statusCode = 401;
      return next(error);
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    logger.info('Usuario cambió su contraseña', { userId: user._id });

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
