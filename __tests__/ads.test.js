const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Ad = require('../src/models/adModel');
const User = require('../src/models/userModel');
const adRoutes = require('../src/routes/adRoutes');
const authRoutes = require('../src/routes/authRoutes');
const { errorHandler } = require('../src/utils/errorHandler');

// Setup de Express para tests
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use(errorHandler);

// Mock de anuncio válido
const mockAd = {
  title: 'Piso moderno en Madrid Centro',
  email: 'contacto@example.com',
  phone: '+34612345678',
  offer: 'rent',
  property: {
    referenceId: 'REF-TEST-001',
    characteristics: {
      type: 'apartment',
      area: 85,
      bedrooms: 2,
      bathrooms: 1,
      floor: 3,
      elevator: true,
      yearBuilt: 2020,
      parkingSpaces: 1,
      furnished: true,
      pool: false,
      garden: false,
      features: ['balcony', 'central-heating']
    },
    location: {
      address: 'Calle Mayor 10',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28013',
      country: 'Spain',
      coordinates: {
        latitude: 40.4168,
        longitude: -3.7038,
        accuracy: 10
      }
    },
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  },
  price: 1500,
  currency: 'EUR',
  description: 'Precioso piso en pleno centro de Madrid, recién reformado.',
  availableFrom: new Date('2025-02-01'),
  status: 'available',
  professional: false,
  logo: 'https://example.com/logo.png'
};

// Helper para crear usuario y obtener token
async function createUserAndGetToken() {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    });

  return response.body.data.token;
}

describe('Ads API', () => {
  describe('GET /api/ads', () => {
    it('debería obtener una lista vacía de anuncios', async () => {
      const response = await request(app)
        .get('/api/ads')
        .expect(200);

      expect(response.body.total).toBe(0);
      expect(response.body.ads).toEqual([]);
    });

    it('debería obtener todos los anuncios con paginación', async () => {
      // Crear 15 anuncios de prueba
      const ads = [];
      for (let i = 0; i < 15; i++) {
        ads.push({
          ...mockAd,
          title: `Anuncio ${i + 1}`,
          property: {
            ...mockAd.property,
            referenceId: `REF-${i + 1}`
          }
        });
      }
      await Ad.insertMany(ads);

      // Obtener primera página (10 items)
      const response1 = await request(app)
        .get('/api/ads?page=1&limit=10')
        .expect(200);

      expect(response1.body.total).toBe(15);
      expect(response1.body.page).toBe('1');
      expect(response1.body.ads).toHaveLength(10);

      // Obtener segunda página (5 items)
      const response2 = await request(app)
        .get('/api/ads?page=2&limit=10')
        .expect(200);

      expect(response2.body.total).toBe(15);
      expect(response2.body.page).toBe('2');
      expect(response2.body.ads).toHaveLength(5);
    });

    it('debería manejar límites de paginación personalizados', async () => {
      // Crear 20 anuncios
      const ads = Array(20).fill(null).map((_, i) => ({
        ...mockAd,
        title: `Anuncio ${i + 1}`,
        property: {
          ...mockAd.property,
          referenceId: `REF-${i + 1}`
        }
      }));
      await Ad.insertMany(ads);

      const response = await request(app)
        .get('/api/ads?page=1&limit=5')
        .expect(200);

      expect(response.body.ads).toHaveLength(5);
    });
  });

  describe('GET /api/ads/:id', () => {
    it('debería obtener un anuncio por ID', async () => {
      const createdAd = await Ad.create(mockAd);

      const response = await request(app)
        .get(`/api/ads/${createdAd._id}`)
        .expect(200);

      expect(response.body.title).toBe(mockAd.title);
      expect(response.body._id).toBe(createdAd._id.toString());
    });

    it('debería retornar 404 si el anuncio no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/ads/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBe('Anuncio no encontrado');
    });

    it('debería retornar 400 con ID inválido', async () => {
      const response = await request(app)
        .get('/api/ads/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ID');
    });
  });

  describe('POST /api/ads', () => {
    it('debería crear un anuncio con autenticación', async () => {
      const token = await createUserAndGetToken();

      const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd)
        .expect(201);

      expect(response.body.title).toBe(mockAd.title);
      expect(response.body.price).toBe(mockAd.price);
      expect(response.body._id).toBeDefined();

      // Verificar que se guardó en la BD
      const adInDb = await Ad.findById(response.body._id);
      expect(adInDb).toBeTruthy();
      expect(adInDb.title).toBe(mockAd.title);
    });

    it('debería fallar sin autenticación', async () => {
      const response = await request(app)
        .post('/api/ads')
        .send(mockAd)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('debería fallar con datos inválidos', async () => {
      const token = await createUserAndGetToken();

      const invalidAd = {
        ...mockAd,
        title: '', // Título vacío
        price: -100, // Precio negativo
        email: 'not-an-email' // Email inválido
      };

      const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAd)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('debería fallar con coordenadas fuera de rango', async () => {
      const token = await createUserAndGetToken();

      const invalidAd = {
        ...mockAd,
        property: {
          ...mockAd.property,
          referenceId: 'REF-INVALID-001',
          location: {
            ...mockAd.property.location,
            coordinates: {
              latitude: 200, // Fuera de rango (-90 a 90)
              longitude: -200, // Fuera de rango (-180 a 180)
              accuracy: 10
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAd)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debería fallar con reference ID duplicado', async () => {
      const token = await createUserAndGetToken();

      // Crear primer anuncio
      await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd)
        .expect(201);

      // Intentar crear con mismo reference ID
      const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/ads/:id', () => {
    it('debería actualizar un anuncio con autenticación', async () => {
      const token = await createUserAndGetToken();

      // Crear anuncio
      const createResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd);

      const adId = createResponse.body._id;

      // Actualizar anuncio
      const updatedData = {
        title: 'Título Actualizado',
        price: 1800
      };

      const response = await request(app)
        .put(`/api/ads/${adId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.title).toBe('Título Actualizado');
      expect(response.body.price).toBe(1800);

      // Verificar otros campos no cambiaron
      expect(response.body.email).toBe(mockAd.email);
    });

    it('debería fallar sin autenticación', async () => {
      const token = await createUserAndGetToken();

      const createResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd);

      const adId = createResponse.body._id;

      const response = await request(app)
        .put(`/api/ads/${adId}`)
        .send({ title: 'Sin Auth' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('debería retornar 404 si el anuncio no existe', async () => {
      const token = await createUserAndGetToken();
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/ads/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.message).toBe('Anuncio no encontrado');
    });

    it('debería validar datos al actualizar', async () => {
      const token = await createUserAndGetToken();

      const createResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd);

      const adId = createResponse.body._id;

      const response = await request(app)
        .put(`/api/ads/${adId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: -500 }) // Precio negativo
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/ads/:id', () => {
    it('debería eliminar un anuncio con autenticación', async () => {
      const token = await createUserAndGetToken();

      const createResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd);

      const adId = createResponse.body._id;

      const response = await request(app)
        .delete(`/api/ads/${adId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toContain('eliminado');

      // Verificar que ya no existe en BD
      const adInDb = await Ad.findById(adId);
      expect(adInDb).toBeNull();
    });

    it('debería fallar sin autenticación', async () => {
      const token = await createUserAndGetToken();

      const createResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd);

      const adId = createResponse.body._id;

      const response = await request(app)
        .delete(`/api/ads/${adId}`)
        .expect(401);

      expect(response.body.success).toBe(false);

      // Verificar que aún existe
      const adInDb = await Ad.findById(adId);
      expect(adInDb).toBeTruthy();
    });

    it('debería retornar 404 si el anuncio no existe', async () => {
      const token = await createUserAndGetToken();
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/ads/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Anuncio no encontrado');
    });
  });

  describe('Validaciones de modelo Ad', () => {
    it('debería requerir todos los campos obligatorios', async () => {
      const token = await createUserAndGetToken();

      const incompleteAd = {
        title: 'Solo título'
        // Faltan todos los demás campos
      };

      const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteAd)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debería validar el enum de oferta', async () => {
      const token = await createUserAndGetToken();

      const invalidAd = {
        ...mockAd,
        offer: 'invalid-offer', // No es buy, rent o share
        property: {
          ...mockAd.property,
          referenceId: 'REF-ENUM-001'
        }
      };

      const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAd)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debería validar el enum de moneda', async () => {
      const token = await createUserAndGetToken();

      const invalidAd = {
        ...mockAd,
        currency: 'JPY', // No es USD, EUR o GBP
        property: {
          ...mockAd.property,
          referenceId: 'REF-CURRENCY-001'
        }
      };

      const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAd)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debería validar área mínima', async () => {
      const token = await createUserAndGetToken();

      const invalidAd = {
        ...mockAd,
        property: {
          ...mockAd.property,
          referenceId: 'REF-AREA-001',
          characteristics: {
            ...mockAd.property.characteristics,
            area: 0 // Debe ser al menos 1
          }
        }
      };

      const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAd)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
