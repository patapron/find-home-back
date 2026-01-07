require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const swaggerUi = require("swagger-ui-express");

// Importar rutas
const adRoutes = require("./src/routes/adRoutes");
const authRoutes = require("./src/routes/authRoutes");

// Importar middlewares y utilidades
const { errorHandler, notFound } = require("./src/utils/errorHandler");
const logger = require("./src/config/logger");
const morganMiddleware = require("./src/middlewares/morganMiddleware");
const swaggerSpec = require("./src/config/swagger");

const app = express();
const PORT = process.env.PORT || 5000;

// Seguridad: Helmet - Headers HTTP seguros
app.use(helmet());

// Seguridad: Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por IP
  message: {
    success: false,
    message: 'Demasiadas peticiones, por favor intenta más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Seguridad: CORS configurado
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:4200'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'La política CORS no permite acceso desde este origen';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Seguridad: Sanitización contra NoSQL injection
app.use(mongoSanitize());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests HTTP
app.use(morganMiddleware);

// Conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  logger.error("MONGO_URI no está definida en las variables de entorno");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    logger.info("✅ Conectado a MongoDB");
    logger.info(`📊 Base de datos: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    logger.error("Error conectando a MongoDB", { error: err.message });
    process.exit(1);
  });

// Event listeners para MongoDB
mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB desconectado');
});

mongoose.connection.on('reconnected', () => {
  logger.info('🔄 MongoDB reconectado');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// Documentación API con Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Find Home API Docs',
}));

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/ads", adRoutes);

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

// Iniciar el servidor
const server = app.listen(PORT, "0.0.0.0", (err) => {
  if (err) {
    logger.error("Error al iniciar el servidor", { error: err.message });
    process.exit(1);
  }
  logger.info(`✅ Servidor corriendo en el puerto ${PORT}`);
  logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📍 URL: http://localhost:${PORT}`);
});

// Manejo de cierre graceful
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} recibido, cerrando servidor...`);

  server.close(async () => {
    logger.info('Servidor HTTP cerrado');

    try {
      await mongoose.connection.close();
      logger.info('Conexión a MongoDB cerrada');
      process.exit(0);
    } catch (err) {
      logger.error('Error al cerrar MongoDB', { error: err.message });
      process.exit(1);
    }
  });

  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    logger.error('Forzando cierre después de timeout');
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => gracefulShutdown('SIGINT'));
process.on("SIGTERM", () => gracefulShutdown('SIGTERM'));

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  gracefulShutdown('uncaughtException');
});
