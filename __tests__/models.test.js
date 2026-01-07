const mongoose = require('mongoose');
const User = require('../src/models/userModel');
const Ad = require('../src/models/adModel');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  describe('Validaciones', () => {
    it('debería crear un usuario válido', async () => {
      const user = await User.create(validUser);

      expect(user._id).toBeDefined();
      expect(user.name).toBe(validUser.name);
      expect(user.email).toBe(validUser.email);
      expect(user.password).not.toBe(validUser.password); // Debe estar hasheado
      expect(user.role).toBe('user'); // Default
      expect(user.isActive).toBe(true); // Default
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('debería fallar sin nombre', async () => {
      const user = new User({
        ...validUser,
        name: undefined
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('debería fallar sin email', async () => {
      const user = new User({
        ...validUser,
        email: undefined
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('debería fallar sin password', async () => {
      const user = new User({
        ...validUser,
        password: undefined
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('debería fallar con email inválido', async () => {
      const user = new User({
        ...validUser,
        email: 'invalid-email'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('debería fallar con password muy corta', async () => {
      const user = new User({
        ...validUser,
        password: '12345' // Menos de 6 caracteres
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('debería fallar con email duplicado', async () => {
      await User.create(validUser);

      const duplicateUser = new User(validUser);

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('debería convertir email a minúsculas', async () => {
      const user = await User.create({
        ...validUser,
        email: 'TEST@EXAMPLE.COM'
      });

      expect(user.email).toBe('test@example.com');
    });

    it('debería validar rol válido', async () => {
      const user = new User({
        ...validUser,
        role: 'invalid-role'
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('debería hashear el password antes de guardar', async () => {
      const user = await User.create(validUser);

      expect(user.password).not.toBe(validUser.password);
      expect(user.password).toMatch(/^\$2[aby]\$/); // Formato bcrypt
    });

    it('no debería rehashear si el password no cambió', async () => {
      const user = await User.create(validUser);
      const originalHash = user.password;

      user.name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it('debería rehashear si el password cambió', async () => {
      const user = await User.create(validUser);
      const originalHash = user.password;

      user.password = 'newpassword123';
      await user.save();

      expect(user.password).not.toBe(originalHash);
      expect(user.password).not.toBe('newpassword123');
    });
  });

  describe('Métodos de instancia', () => {
    it('comparePassword() debería retornar true con password correcto', async () => {
      const user = await User.create(validUser);

      const isMatch = await user.comparePassword('password123');

      expect(isMatch).toBe(true);
    });

    it('comparePassword() debería retornar false con password incorrecto', async () => {
      const user = await User.create(validUser);

      const isMatch = await user.comparePassword('wrongpassword');

      expect(isMatch).toBe(false);
    });

    it('toJSON() no debería incluir password', async () => {
      const user = await User.create(validUser);

      const userJson = user.toJSON();

      expect(userJson.password).toBeUndefined();
      expect(userJson.email).toBe(validUser.email);
      expect(userJson.name).toBe(validUser.name);
    });
  });

  describe('Índices', () => {
    it('debería tener índice en email', async () => {
      const indexes = await User.collection.getIndexes();

      expect(indexes.email_1).toBeDefined();
    });

    it('debería tener índice en role', async () => {
      const indexes = await User.collection.getIndexes();

      expect(indexes.role_1).toBeDefined();
    });
  });
});

describe('Ad Model', () => {
  const validAd = {
    title: 'Piso moderno en Madrid',
    email: 'contacto@example.com',
    phone: '+34612345678',
    offer: 'rent',
    property: {
      referenceId: 'REF-001',
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
        features: ['balcony']
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
      images: ['https://example.com/image.jpg']
    },
    price: 1500,
    currency: 'EUR',
    description: 'Precioso piso en el centro',
    availableFrom: new Date('2025-02-01'),
    status: 'available',
    professional: false,
    logo: 'https://example.com/logo.png'
  };

  describe('Validaciones básicas', () => {
    it('debería crear un anuncio válido', async () => {
      const ad = await Ad.create(validAd);

      expect(ad._id).toBeDefined();
      expect(ad.title).toBe(validAd.title);
      expect(ad.price).toBe(validAd.price);
      expect(ad.favorites).toBe(0); // Default
      expect(ad.views).toBe(0); // Default
      expect(ad.createdAt).toBeDefined();
      expect(ad.updatedAt).toBeDefined();
    });

    it('debería fallar sin título', async () => {
      const ad = new Ad({
        ...validAd,
        title: undefined
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería fallar sin email', async () => {
      const ad = new Ad({
        ...validAd,
        email: undefined
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería fallar con email inválido', async () => {
      const ad = new Ad({
        ...validAd,
        email: 'not-an-email'
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería fallar sin precio', async () => {
      const ad = new Ad({
        ...validAd,
        price: undefined
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería fallar con precio negativo', async () => {
      const ad = new Ad({
        ...validAd,
        price: -100
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería fallar con precio cero', async () => {
      const ad = new Ad({
        ...validAd,
        price: 0
      });

      await expect(ad.save()).rejects.toThrow();
    });
  });

  describe('Validaciones de enums', () => {
    it('debería aceptar offer = buy', async () => {
      const ad = await Ad.create({
        ...validAd,
        offer: 'buy',
        property: {
          ...validAd.property,
          referenceId: 'REF-BUY-001'
        }
      });

      expect(ad.offer).toBe('buy');
    });

    it('debería aceptar offer = rent', async () => {
      const ad = await Ad.create({
        ...validAd,
        offer: 'rent',
        property: {
          ...validAd.property,
          referenceId: 'REF-RENT-001'
        }
      });

      expect(ad.offer).toBe('rent');
    });

    it('debería aceptar offer = share', async () => {
      const ad = await Ad.create({
        ...validAd,
        offer: 'share',
        property: {
          ...validAd.property,
          referenceId: 'REF-SHARE-001'
        }
      });

      expect(ad.offer).toBe('share');
    });

    it('debería fallar con offer inválido', async () => {
      const ad = new Ad({
        ...validAd,
        offer: 'sell'
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería validar currency (EUR, USD, GBP)', async () => {
      const currencies = ['EUR', 'USD', 'GBP'];

      for (const currency of currencies) {
        const ad = await Ad.create({
          ...validAd,
          currency,
          property: {
            ...validAd.property,
            referenceId: `REF-${currency}-001`
          }
        });

        expect(ad.currency).toBe(currency);
      }
    });

    it('debería fallar con currency inválida', async () => {
      const ad = new Ad({
        ...validAd,
        currency: 'JPY'
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería validar status (available, sold, rented)', async () => {
      const statuses = ['available', 'sold', 'rented'];

      for (const status of statuses) {
        const ad = await Ad.create({
          ...validAd,
          status,
          property: {
            ...validAd.property,
            referenceId: `REF-${status}-001`
          }
        });

        expect(ad.status).toBe(status);
      }
    });
  });

  describe('Validaciones de coordenadas', () => {
    it('debería aceptar latitud válida', async () => {
      const validLatitudes = [-90, -45, 0, 45, 90];

      for (const lat of validLatitudes) {
        const ad = await Ad.create({
          ...validAd,
          property: {
            ...validAd.property,
            referenceId: `REF-LAT-${lat}`,
            location: {
              ...validAd.property.location,
              coordinates: {
                latitude: lat,
                longitude: 0,
                accuracy: 10
              }
            }
          }
        });

        expect(ad.property.location.coordinates.latitude).toBe(lat);
      }
    });

    it('debería fallar con latitud > 90', async () => {
      const ad = new Ad({
        ...validAd,
        property: {
          ...validAd.property,
          location: {
            ...validAd.property.location,
            coordinates: {
              latitude: 91,
              longitude: 0,
              accuracy: 10
            }
          }
        }
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería fallar con latitud < -90', async () => {
      const ad = new Ad({
        ...validAd,
        property: {
          ...validAd.property,
          location: {
            ...validAd.property.location,
            coordinates: {
              latitude: -91,
              longitude: 0,
              accuracy: 10
            }
          }
        }
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería fallar con longitud > 180', async () => {
      const ad = new Ad({
        ...validAd,
        property: {
          ...validAd.property,
          location: {
            ...validAd.property.location,
            coordinates: {
              latitude: 0,
              longitude: 181,
              accuracy: 10
            }
          }
        }
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería fallar con longitud < -180', async () => {
      const ad = new Ad({
        ...validAd,
        property: {
          ...validAd.property,
          location: {
            ...validAd.property.location,
            coordinates: {
              latitude: 0,
              longitude: -181,
              accuracy: 10
            }
          }
        }
      });

      await expect(ad.save()).rejects.toThrow();
    });
  });

  describe('Validaciones de propiedad', () => {
    it('debería fallar con área < 1', async () => {
      const ad = new Ad({
        ...validAd,
        property: {
          ...validAd.property,
          characteristics: {
            ...validAd.property.characteristics,
            area: 0
          }
        }
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería fallar con bedrooms negativo', async () => {
      const ad = new Ad({
        ...validAd,
        property: {
          ...validAd.property,
          characteristics: {
            ...validAd.property.characteristics,
            bedrooms: -1
          }
        }
      });

      await expect(ad.save()).rejects.toThrow();
    });

    it('debería aceptar bedrooms = 0 (estudio)', async () => {
      const ad = await Ad.create({
        ...validAd,
        property: {
          ...validAd.property,
          referenceId: 'REF-STUDIO-001',
          characteristics: {
            ...validAd.property.characteristics,
            bedrooms: 0
          }
        }
      });

      expect(ad.property.characteristics.bedrooms).toBe(0);
    });
  });

  describe('Reference ID único', () => {
    it('debería fallar con reference ID duplicado', async () => {
      await Ad.create(validAd);

      const duplicateAd = new Ad(validAd);

      await expect(duplicateAd.save()).rejects.toThrow();
    });
  });

  describe('Índices', () => {
    it('debería tener índice geoespacial en coordenadas', async () => {
      const indexes = await Ad.collection.getIndexes();

      const geoIndex = Object.values(indexes).find(
        idx => idx && idx['property.location.coordinates'] === '2dsphere'
      );

      expect(geoIndex).toBeDefined();
    });

    it('debería tener índice en offer y status', async () => {
      const indexes = await Ad.collection.getIndexes();

      const offerStatusIndex = Object.keys(indexes).find(
        key => key.includes('offer') && key.includes('status')
      );

      expect(offerStatusIndex).toBeDefined();
    });

    it('debería tener índice en ciudad', async () => {
      const indexes = await Ad.collection.getIndexes();

      const cityIndex = Object.keys(indexes).find(
        key => key.includes('city')
      );

      expect(cityIndex).toBeDefined();
    });
  });
});
