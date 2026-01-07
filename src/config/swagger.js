const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Find Home API',
      version: '1.0.0',
      description: 'API RESTful para plataforma de búsqueda de propiedades inmobiliarias',
      contact: {
        name: 'Find Home Team',
        email: 'support@findhome.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Servidor de desarrollo',
      },
      {
        url: 'https://api.findhome.com',
        description: 'Servidor de producción',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint /api/auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Ad: {
          type: 'object',
          required: ['title', 'email', 'phone', 'offer', 'price', 'currency', 'property', 'description', 'availableFrom', 'status'],
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', maxLength: 100, example: 'Piso moderno en Madrid' },
            email: { type: 'string', format: 'email', example: 'contacto@example.com' },
            phone: { type: 'string', example: '+34612345678' },
            offer: { type: 'string', enum: ['buy', 'rent', 'share'], example: 'rent' },
            price: { type: 'number', minimum: 1, example: 1500 },
            currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'], example: 'EUR' },
            property: {
              type: 'object',
              properties: {
                referenceId: { type: 'string', example: 'REF-001' },
                characteristics: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', example: 'apartment' },
                    area: { type: 'number', minimum: 1, example: 85 },
                    bedrooms: { type: 'number', minimum: 0, example: 2 },
                    bathrooms: { type: 'number', minimum: 0, example: 1 },
                    floor: { type: 'number', example: 3 },
                    elevator: { type: 'boolean', example: true },
                    yearBuilt: { type: 'number', example: 2020 },
                    parkingSpaces: { type: 'number', example: 1 },
                    furnished: { type: 'boolean', example: true },
                    pool: { type: 'boolean', example: false },
                    garden: { type: 'boolean', example: false },
                    features: { type: 'array', items: { type: 'string' }, example: ['balcony', 'central-heating'] },
                  },
                },
                location: {
                  type: 'object',
                  properties: {
                    address: { type: 'string', example: 'Calle Mayor 10' },
                    city: { type: 'string', example: 'Madrid' },
                    state: { type: 'string', example: 'Madrid' },
                    zipCode: { type: 'string', example: '28013' },
                    country: { type: 'string', example: 'Spain' },
                    coordinates: {
                      type: 'object',
                      properties: {
                        latitude: { type: 'number', minimum: -90, maximum: 90, example: 40.4168 },
                        longitude: { type: 'number', minimum: -180, maximum: 180, example: -3.7038 },
                        accuracy: { type: 'number', example: 10 },
                      },
                    },
                  },
                },
                images: { type: 'array', items: { type: 'string', format: 'uri' }, example: ['https://example.com/image1.jpg'] },
              },
            },
            description: { type: 'string', maxLength: 2000, example: 'Precioso piso en pleno centro...' },
            availableFrom: { type: 'string', format: 'date', example: '2025-02-01' },
            status: { type: 'string', enum: ['available', 'sold', 'rented'], example: 'available' },
            professional: { type: 'boolean', example: false },
            logo: { type: 'string', format: 'uri', example: 'https://example.com/logo.png' },
            favorites: { type: 'number', default: 0, example: 0 },
            views: { type: 'number', default: 0, example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Endpoints de autenticación' },
      { name: 'Ads', description: 'Endpoints de anuncios inmobiliarios' },
      { name: 'Health', description: 'Health checks del servidor' },
    ],
  },
  apis: ['./src/routes/*.js'], // Archivos con anotaciones Swagger
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
