const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Ad = require('../src/models/adModel');
const User = require('../src/models/userModel');
const adRoutes = require('../src/routes/adRoutes');
const authRoutes = require('../src/routes/authRoutes');
const { errorHandler, notFound } = require('../src/utils/errorHandler');

// Setup de Express para tests E2E
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use(notFound);
app.use(errorHandler);

// Mock de anuncio para E2E
const mockAd = {
  title: 'Piso moderno en Madrid Centro',
  email: 'contacto@example.com',
  phone: '+34612345678',
  offer: 'rent',
  property: {
    referenceId: 'REF-E2E-001',
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
    images: ['https://example.com/image1.jpg']
  },
  price: 1500,
  currency: 'EUR',
  description: 'Precioso piso en pleno centro de Madrid',
  availableFrom: new Date('2025-02-01'),
  status: 'available',
  professional: false,
  logo: 'https://example.com/logo.png'
};

describe('E2E Tests - Flujos Completos', () => {
  describe('Flujo completo de usuario: Registro → Login → CRUD de Anuncios', () => {
    it('debería completar flujo completo de usuario y anuncios', async () => {
      // 1. REGISTRO
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Usuario E2E',
          email: 'e2e@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe('e2e@example.com');
      expect(registerResponse.body.data.token).toBeDefined();

      const token = registerResponse.body.data.token;

      // 2. LOGIN
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'e2e@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();

      // 3. VERIFICAR USUARIO AUTENTICADO
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.email).toBe('e2e@example.com');
      expect(meResponse.body.name).toBe('Usuario E2E');

      // 4. CREAR ANUNCIO
      const createAdResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd)
        .expect(201);

      expect(createAdResponse.body.title).toBe(mockAd.title);
      expect(createAdResponse.body.price).toBe(mockAd.price);

      const adId = createAdResponse.body._id;

      // 5. OBTENER ANUNCIO CREADO
      const getAdResponse = await request(app)
        .get(`/api/ads/${adId}`)
        .expect(200);

      expect(getAdResponse.body._id).toBe(adId);
      expect(getAdResponse.body.title).toBe(mockAd.title);

      // 6. ACTUALIZAR ANUNCIO
      const updateAdResponse = await request(app)
        .put(`/api/ads/${adId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Título Actualizado E2E',
          price: 1800
        })
        .expect(200);

      expect(updateAdResponse.body.title).toBe('Título Actualizado E2E');
      expect(updateAdResponse.body.price).toBe(1800);

      // 7. LISTAR ANUNCIOS (PÚBLICO)
      const listAdsResponse = await request(app)
        .get('/api/ads')
        .expect(200);

      expect(listAdsResponse.body.total).toBe(1);
      expect(listAdsResponse.body.ads).toHaveLength(1);
      expect(listAdsResponse.body.ads[0].title).toBe('Título Actualizado E2E');

      // 8. ACTUALIZAR PERFIL
      const updateProfileResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Usuario E2E Actualizado'
        })
        .expect(200);

      expect(updateProfileResponse.body.user.name).toBe('Usuario E2E Actualizado');

      // 9. CAMBIAR CONTRASEÑA
      const changePasswordResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(changePasswordResponse.body.success).toBe(true);

      // 10. LOGIN CON NUEVA CONTRASEÑA
      const loginWithNewPassword = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'e2e@example.com',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginWithNewPassword.body.success).toBe(true);

      const newToken = loginWithNewPassword.body.data.token;

      // 11. ELIMINAR ANUNCIO
      const deleteAdResponse = await request(app)
        .delete(`/api/ads/${adId}`)
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(deleteAdResponse.body.success).toBe(true);

      // 12. VERIFICAR QUE EL ANUNCIO FUE ELIMINADO
      const listAfterDelete = await request(app)
        .get('/api/ads')
        .expect(200);

      expect(listAfterDelete.body.total).toBe(0);
      expect(listAfterDelete.body.ads).toHaveLength(0);
    });
  });

  describe('Flujo de búsqueda y visualización pública', () => {
    it('debería permitir buscar y ver anuncios sin autenticación', async () => {
      // Crear varios anuncios primero (con un usuario registrado)
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Creador de Anuncios',
          email: 'creator@example.com',
          password: 'password123'
        });

      const token = registerResponse.body.data.token;

      // Crear 5 anuncios
      const ads = [];
      for (let i = 1; i <= 5; i++) {
        const ad = await request(app)
          .post('/api/ads')
          .set('Authorization', `Bearer ${token}`)
          .send({
            ...mockAd,
            title: `Anuncio ${i}`,
            price: 1000 + (i * 100),
            property: {
              ...mockAd.property,
              referenceId: `REF-SEARCH-${i}`
            }
          });
        ads.push(ad.body);
      }

      // 1. BUSCAR TODOS LOS ANUNCIOS (SIN AUTH)
      const searchAllResponse = await request(app)
        .get('/api/ads')
        .expect(200);

      expect(searchAllResponse.body.total).toBe(5);
      expect(searchAllResponse.body.ads).toHaveLength(5);

      // 2. BUSCAR CON PAGINACIÓN (SIN AUTH)
      const page1Response = await request(app)
        .get('/api/ads?page=1&limit=3')
        .expect(200);

      expect(page1Response.body.total).toBe(5);
      expect(page1Response.body.ads).toHaveLength(3);
      expect(page1Response.body.page).toBe('1');

      const page2Response = await request(app)
        .get('/api/ads?page=2&limit=3')
        .expect(200);

      expect(page2Response.body.total).toBe(5);
      expect(page2Response.body.ads).toHaveLength(2);
      expect(page2Response.body.page).toBe('2');

      // 3. VER DETALLE DE ANUNCIO (SIN AUTH)
      const adId = ads[0]._id;
      const detailResponse = await request(app)
        .get(`/api/ads/${adId}`)
        .expect(200);

      expect(detailResponse.body._id).toBe(adId);
      expect(detailResponse.body.title).toBe('Anuncio 1');
      expect(detailResponse.body.price).toBe(1100);

      // 4. INTENTAR CREAR SIN AUTH (DEBE FALLAR)
      const createWithoutAuthResponse = await request(app)
        .post('/api/ads')
        .send(mockAd)
        .expect(401);

      expect(createWithoutAuthResponse.body.success).toBe(false);

      // 5. INTENTAR ACTUALIZAR SIN AUTH (DEBE FALLAR)
      const updateWithoutAuthResponse = await request(app)
        .put(`/api/ads/${adId}`)
        .send({ title: 'Intento sin auth' })
        .expect(401);

      expect(updateWithoutAuthResponse.body.success).toBe(false);

      // 6. INTENTAR ELIMINAR SIN AUTH (DEBE FALLAR)
      const deleteWithoutAuthResponse = await request(app)
        .delete(`/api/ads/${adId}`)
        .expect(401);

      expect(deleteWithoutAuthResponse.body.success).toBe(false);
    });
  });

  describe('Flujo de errores de autenticación', () => {
    it('debería manejar correctamente errores de autenticación', async () => {
      // 1. LOGIN CON USUARIO INEXISTENTE
      const loginNonExistentResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(loginNonExistentResponse.body.success).toBe(false);
      expect(loginNonExistentResponse.body.message).toContain('Credenciales inválidas');

      // 2. REGISTRO EXITOSO
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(201);

      const token = registerResponse.body.data.token;

      // 3. LOGIN CON CONTRASEÑA INCORRECTA
      const loginWrongPasswordResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(loginWrongPasswordResponse.body.success).toBe(false);

      // 4. ACCESO CON TOKEN INVÁLIDO
      const invalidTokenResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(invalidTokenResponse.body.success).toBe(false);

      // 5. ACCESO SIN TOKEN
      const noTokenResponse = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(noTokenResponse.body.success).toBe(false);

      // 6. ACCESO CON TOKEN MALFORMADO
      const malformedTokenResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(malformedTokenResponse.body.success).toBe(false);

      // 7. CAMBIAR CONTRASEÑA CON CONTRASEÑA ACTUAL INCORRECTA
      const wrongCurrentPasswordResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongcurrent',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(wrongCurrentPasswordResponse.body.success).toBe(false);
      expect(wrongCurrentPasswordResponse.body.message).toContain('actual es incorrecta');
    });
  });

  describe('Flujo de validación completa', () => {
    it('debería validar todos los campos en flujo completo', async () => {
      // 1. REGISTRO CON DATOS INVÁLIDOS
      const invalidRegisterResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'not-an-email',
          password: '123' // Muy corta
        })
        .expect(400);

      expect(invalidRegisterResponse.body.success).toBe(false);
      expect(invalidRegisterResponse.body.errors).toBeDefined();

      // 2. REGISTRO VÁLIDO
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Valid User',
          email: 'valid@example.com',
          password: 'password123'
        })
        .expect(201);

      const token = registerResponse.body.data.token;

      // 3. CREAR ANUNCIO CON DATOS INVÁLIDOS
      const invalidAdResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '', // Vacío
          email: 'not-email',
          price: -100, // Negativo
          property: {
            referenceId: 'REF-INVALID',
            characteristics: {
              type: 'apartment',
              area: 0, // Inválido
              bedrooms: -1 // Negativo
            },
            location: {
              coordinates: {
                latitude: 200, // Fuera de rango
                longitude: -200 // Fuera de rango
              }
            }
          }
        })
        .expect(400);

      expect(invalidAdResponse.body.success).toBe(false);
      expect(invalidAdResponse.body.errors).toBeDefined();

      // 4. CREAR ANUNCIO VÁLIDO
      const validAdResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd)
        .expect(201);

      expect(validAdResponse.body.title).toBe(mockAd.title);

      const adId = validAdResponse.body._id;

      // 5. ACTUALIZAR CON DATOS INVÁLIDOS
      const invalidUpdateResponse = await request(app)
        .put(`/api/ads/${adId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          price: 0, // Inválido
          email: 'invalid-email'
        })
        .expect(400);

      expect(invalidUpdateResponse.body.success).toBe(false);

      // 6. ACTUALIZAR PERFIL CON EMAIL INVÁLIDO
      const invalidProfileResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'not-valid-email'
        })
        .expect(400);

      expect(invalidProfileResponse.body.success).toBe(false);

      // 7. CAMBIAR CONTRASEÑA MUY CORTA
      const shortPasswordResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: '123' // Muy corta
        })
        .expect(400);

      expect(shortPasswordResponse.body.success).toBe(false);
    });
  });

  describe('Flujo de duplicación y unicidad', () => {
    it('debería manejar correctamente restricciones de unicidad', async () => {
      // 1. REGISTRO INICIAL
      const firstRegisterResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email: 'unique@example.com',
          password: 'password123'
        })
        .expect(201);

      const token = firstRegisterResponse.body.data.token;

      // 2. INTENTAR REGISTRAR CON EMAIL DUPLICADO
      const duplicateEmailResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'unique@example.com', // Email duplicado
          password: 'password456'
        })
        .expect(400);

      expect(duplicateEmailResponse.body.success).toBe(false);

      // 3. CREAR PRIMER ANUNCIO
      const firstAdResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd)
        .expect(201);

      expect(firstAdResponse.body.property.referenceId).toBe('REF-E2E-001');

      // 4. INTENTAR CREAR ANUNCIO CON REFERENCE ID DUPLICADO
      const duplicateRefIdResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send(mockAd) // Mismo referenceId
        .expect(400);

      expect(duplicateRefIdResponse.body.success).toBe(false);

      // 5. CREAR ANUNCIO CON REFERENCE ID DIFERENTE (DEBE FUNCIONAR)
      const uniqueRefIdResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...mockAd,
          property: {
            ...mockAd.property,
            referenceId: 'REF-E2E-002' // Diferente
          }
        })
        .expect(201);

      expect(uniqueRefIdResponse.body.property.referenceId).toBe('REF-E2E-002');
    });
  });

  describe('Flujo de roles y permisos', () => {
    it('debería manejar correctamente roles de usuario', async () => {
      // 1. REGISTRO DE USUARIO NORMAL
      const userRegisterResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Normal User',
          email: 'user@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(userRegisterResponse.body.data.user.role).toBe('user');

      const userToken = userRegisterResponse.body.data.token;

      // 2. VERIFICAR QUE USUARIO TIENE ROL 'USER'
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(meResponse.body.role).toBe('user');

      // 3. USUARIO PUEDE CREAR ANUNCIOS
      const createAdResponse = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${userToken}`)
        .send(mockAd)
        .expect(201);

      expect(createAdResponse.body.title).toBe(mockAd.title);

      // 4. USUARIO PUEDE VER SUS PROPIOS DATOS
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(profileResponse.body.email).toBe('user@example.com');
    });
  });

  describe('Flujo de ID inválidos', () => {
    it('debería manejar correctamente IDs inválidos', async () => {
      // 1. GET CON ID INVÁLIDO
      const invalidGetResponse = await request(app)
        .get('/api/ads/invalid-id-format')
        .expect(400);

      expect(invalidGetResponse.body.success).toBe(false);
      expect(invalidGetResponse.body.message).toContain('ID');

      // 2. REGISTRO Y LOGIN
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      const token = registerResponse.body.data.token;

      // 3. UPDATE CON ID INVÁLIDO
      const invalidUpdateResponse = await request(app)
        .put('/api/ads/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated' })
        .expect(400);

      expect(invalidUpdateResponse.body.success).toBe(false);

      // 4. DELETE CON ID INVÁLIDO
      const invalidDeleteResponse = await request(app)
        .delete('/api/ads/123456')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(invalidDeleteResponse.body.success).toBe(false);

      // 5. GET CON ID VÁLIDO PERO INEXISTENTE
      const fakeId = new mongoose.Types.ObjectId();
      const notFoundResponse = await request(app)
        .get(`/api/ads/${fakeId}`)
        .expect(404);

      expect(notFoundResponse.body.success).toBe(false);
      expect(notFoundResponse.body.message).toBe('Anuncio no encontrado');
    });
  });

  describe('Flujo de ruta no encontrada (404)', () => {
    it('debería retornar 404 para rutas inexistentes', async () => {
      const notFoundResponse = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(notFoundResponse.body.success).toBe(false);
      expect(notFoundResponse.body.message).toContain('non-existent-route');
    });
  });
});
