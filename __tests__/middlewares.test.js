const jwt = require('jsonwebtoken');
const { authenticate, isAdmin, optionalAuth } = require('../src/middlewares/authMiddleware');
const { errorHandler, notFound } = require('../src/utils/errorHandler');
const User = require('../src/models/userModel');
const mongoose = require('mongoose');

// Mock de request, response y next
const mockRequest = (options = {}) => {
  return {
    headers: options.headers || {},
    user: options.user,
    method: options.method || 'GET',
    path: options.path || '/test',
    ip: options.ip || '127.0.0.1',
    originalUrl: options.originalUrl || '/test',
    ...options
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
  describe('authenticate()', () => {
    it('debería autenticar con token válido', async () => {
      // Crear usuario
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      // Generar token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'test-secret');

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('test@example.com');
    });

    it('debería fallar sin token', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('token');
    });

    it('debería fallar con token malformado', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'InvalidFormat'
        }
      });
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
    });

    it('debería fallar con token inválido', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid.token.here'
        }
      });
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
    });

    it('debería fallar si el usuario no existe', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const token = jwt.sign({ id: fakeUserId }, process.env.JWT_SECRET || 'test-secret');

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('Usuario no encontrado');
    });

    it('debería fallar si el usuario está inactivo', async () => {
      const user = await User.create({
        name: 'Inactive User',
        email: 'inactive@example.com',
        password: 'password123',
        isActive: false
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'test-secret');

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('inactivo');
    });
  });

  describe('isAdmin()', () => {
    it('debería permitir acceso a usuarios admin', () => {
      const req = mockRequest({
        user: {
          _id: 'user-id',
          role: 'admin'
        }
      });
      const res = mockResponse();
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('debería denegar acceso a usuarios no admin', () => {
      const req = mockRequest({
        user: {
          _id: 'user-id',
          role: 'user'
        }
      });
      const res = mockResponse();
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('admin');
    });

    it('debería denegar acceso sin usuario', () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(403);
    });
  });

  describe('optionalAuth()', () => {
    it('debería añadir usuario si hay token válido', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'test-secret');

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = mockResponse();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('test@example.com');
    });

    it('debería continuar sin error si no hay token', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });

    it('debería continuar sin error si el token es inválido', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid.token'
        }
      });
      const res = mockResponse();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });
  });
});

describe('Error Handler Middleware', () => {
  describe('errorHandler()', () => {
    beforeEach(() => {
      // Mockear logger para tests
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('debería manejar ValidationError de Mongoose', () => {
      const error = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email is required' },
          password: { message: 'Password is too short' }
        }
      };

      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining(['Email is required', 'Password is too short'])
      });
    });

    it('debería manejar CastError de Mongoose', () => {
      const error = {
        name: 'CastError',
        path: '_id',
        value: 'invalid-id'
      };

      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de ID inválido',
        field: '_id'
      });
    });

    it('debería manejar duplicate key error (11000)', () => {
      const error = {
        code: 11000,
        keyPattern: { email: 1 }
      };

      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El email ya existe',
        field: 'email'
      });
    });

    it('debería manejar JsonWebTokenError', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'invalid token'
      };

      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido'
      });
    });

    it('debería manejar TokenExpiredError', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'jwt expired'
      };

      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expirado'
      });
    });

    it('debería manejar errores genéricos con statusCode', () => {
      const error = {
        statusCode: 403,
        message: 'Forbidden'
      };

      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden'
      });
    });

    it('debería ocultar detalles en producción', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = {
        statusCode: 500,
        message: 'Internal database error',
        stack: 'Error stack...'
      };

      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('debería incluir stack en desarrollo', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = {
        message: 'Test error',
        stack: 'Error: Test error\n    at ...'
      };

      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFound()', () => {
    it('debería crear error 404', () => {
      const req = mockRequest({ originalUrl: '/api/non-existent' });
      const res = mockResponse();
      const next = jest.fn();

      notFound(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('/api/non-existent');
    });
  });
});
