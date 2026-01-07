const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Configurar variables de entorno para tests
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';

let mongoServer;

// Setup global para todos los tests
beforeAll(async () => {
  // Crear servidor MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Conectar mongoose al servidor en memoria
  await mongoose.connect(mongoUri);
}, 30000); // Timeout de 30 segundos para setup

// Cleanup global
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

// Limpiar base de datos antes de cada test
beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
