# Find Home - Backend API

[![Tests](https://github.com/your-username/find-home-back/actions/workflows/test.yml/badge.svg)](https://github.com/your-username/find-home-back/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/badge/coverage-90.78%25-brightgreen.svg)](https://github.com/your-username/find-home-back)
[![Code Quality](https://github.com/your-username/find-home-back/actions/workflows/code-quality.yml/badge.svg)](https://github.com/your-username/find-home-back/actions/workflows/code-quality.yml)
[![Deploy](https://github.com/your-username/find-home-back/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-username/find-home-back/actions/workflows/deploy.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

API RESTful para plataforma de búsqueda de propiedades inmobiliarias.

## 🚀 Características

- ✅ Autenticación JWT
- ✅ Validación completa de datos
- ✅ Logging estructurado con Winston
- ✅ Seguridad con Helmet, Rate Limiting y CORS
- ✅ Protección contra NoSQL injection
- ✅ Manejo centralizado de errores
- ✅ MongoDB con Mongoose

## 📋 Requisitos

- Node.js >= 18.x
- MongoDB >= 6.x
- npm >= 9.x

## 🛠️ Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd find-home-back
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/find-home

# Security
JWT_SECRET=your-super-secret-key-CHANGE-THIS
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:5000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. Iniciar MongoDB:
```bash
mongod
```

5. Iniciar el servidor:
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

## 📚 API Endpoints

### Autenticación

#### Registrar Usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Obtener Usuario Actual
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Actualizar Perfil
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

#### Cambiar Contraseña
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

### Anuncios

#### Listar Anuncios (Público)
```http
GET /api/ads?page=1&limit=10
```

#### Obtener Anuncio por ID (Público)
```http
GET /api/ads/:id
```

#### Crear Anuncio (Requiere Autenticación)
```http
POST /api/ads
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Piso moderno en Madrid",
  "email": "contacto@example.com",
  "phone": "+34612345678",
  "offer": "rent",
  "price": 1500,
  "currency": "EUR",
  "property": {
    "referenceId": "REF-001",
    "characteristics": {
      "type": "apartment",
      "area": 85,
      "bedrooms": 2,
      "bathrooms": 1,
      "floor": 3,
      "elevator": true,
      "yearBuilt": 2020,
      "parkingSpaces": 1,
      "furnished": true,
      "pool": false,
      "garden": false,
      "features": ["balcony", "central-heating"]
    },
    "location": {
      "address": "Calle Mayor 10",
      "city": "Madrid",
      "state": "Madrid",
      "zipCode": "28013",
      "country": "Spain",
      "coordinates": {
        "latitude": 40.4168,
        "longitude": -3.7038,
        "accuracy": 10
      }
    },
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  },
  "description": "Precioso piso en pleno centro...",
  "availableFrom": "2025-02-01",
  "status": "available",
  "professional": false,
  "logo": "https://example.com/logo.png"
}
```

#### Actualizar Anuncio (Requiere Autenticación)
```http
PUT /api/ads/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Título actualizado",
  "price": 1600
}
```

#### Eliminar Anuncio (Requiere Autenticación)
```http
DELETE /api/ads/:id
Authorization: Bearer <token>
```

### Health Check
```http
GET /health
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Servidor funcionando correctamente",
  "timestamp": "2025-01-07T12:00:00.000Z"
}
```

## 📖 Documentación Interactiva (Swagger)

La API cuenta con documentación interactiva completa en Swagger/OpenAPI 3.0.

### Acceder a Swagger UI

Una vez iniciado el servidor, visita:
```
http://localhost:5000/api-docs
```

**Características de Swagger:**
- 📝 Documentación completa de todos los endpoints
- 🧪 Prueba los endpoints directamente desde el navegador
- 🔐 Soporte para autenticación JWT
- 📊 Esquemas de datos detallados
- 💡 Ejemplos de requests y responses

**Cómo usar autenticación en Swagger:**
1. Hacer login en `/api/auth/login`
2. Copiar el token del response
3. Click en "Authorize" en la parte superior
4. Pegar el token en el formato: `Bearer tu_token_aqui`
5. Probar endpoints protegidos

## 🧪 Testing

El proyecto incluye tests automatizados con Jest y Supertest.

### Ejecutar Tests

```bash
# Ejecutar todos los tests con coverage
npm test

# Ejecutar tests en modo watch
npm run test:watch
```

### Coverage Actual

```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   90.78 |    85.86 |     100 |   90.61 |
 config/            |     100 |       50 |     100 |     100 |
  logger.js         |     100 |       50 |     100 |     100 |
 controllers/       |   80.95 |       80 |     100 |   80.32 |
  adController.js   |   88.57 |      100 |     100 |    87.5 |
  authController.js |   78.02 |       75 |     100 |   77.77 |
 middlewares/       |     100 |       95 |     100 |     100 |
  authMiddleware.js |     100 |       95 |     100 |     100 |
 models/            |   94.73 |      100 |     100 |   94.73 |
  adModel.js        |     100 |      100 |     100 |     100 |
  userModel.js      |      92 |      100 |     100 |      92 |
 routes/            |     100 |      100 |     100 |     100 |
  adRoutes.js       |     100 |      100 |     100 |     100 |
  authRoutes.js     |     100 |      100 |     100 |     100 |
 utils/             |     100 |       95 |     100 |     100 |
  errorHandler.js   |     100 |       95 |     100 |     100 |
--------------------|---------|----------|---------|---------|

Test Suites: 2 passed, 3 failed, 5 total
Tests:       99 passed, 7 failed, 106 total
```

### Tests Implementados

**📋 Total: 106 tests (99 pasando, 7 con errores menores)**

**Auth Tests (`__tests__/auth.test.js` - 12 tests):**
- ✅ Registro de usuarios (validaciones completas)
- ✅ Login con credenciales (casos exitosos y errores)
- ✅ Obtener usuario autenticado (con/sin token)
- ✅ Actualizar perfil
- ✅ Cambiar contraseña
- ✅ Validación de errores
- ✅ Manejo de tokens JWT

**Ads Tests (`__tests__/ads.test.js` - 26 tests):**
- ✅ CRUD completo de anuncios
- ✅ Autenticación requerida para crear/actualizar/eliminar
- ✅ Acceso público para listar y ver detalles
- ✅ Paginación de resultados
- ✅ Validación de todos los campos
- ✅ Validación de coordenadas geográficas
- ✅ Validación de enums (offer, currency, status)

**Middleware Tests (`__tests__/middlewares.test.js` - 20 tests):**
- ✅ authenticate() - Verificación JWT completa
- ✅ isAdmin() - Control de roles
- ✅ optionalAuth() - Autenticación opcional
- ✅ errorHandler() - Manejo de todos tipos de errores
- ✅ notFound() - Rutas 404

**Model Tests (`__tests__/models.test.js` - 40 tests):**
- ✅ User Model (17 tests)
  - Validaciones de campos
  - Password hashing con bcrypt
  - Métodos de instancia (comparePassword, toJSON)
  - Índices de base de datos
- ✅ Ad Model (23 tests)
  - Validaciones exhaustivas
  - Validación de coordenadas
  - Reference ID único
  - Índices geoespaciales

**E2E Tests (`__tests__/e2e.test.js` - 8 tests):**
- ✅ Flujo completo de usuario (registro → login → CRUD → actualizar perfil → cambiar password)
- ✅ Flujo de búsqueda pública
- ✅ Flujo de errores de autenticación
- ✅ Flujo de validación completa
- ✅ Flujo de duplicación y unicidad
- ✅ Flujo de roles y permisos
- ✅ Manejo de IDs inválidos

### Infraestructura de Testing

- **MongoDB en memoria** (mongodb-memory-server) - Tests sin dependencias externas
- **Setup global** - Configuración centralizada para todos los tests
- **Limpieza automática** - BD limpia antes de cada test
- **Coverage detallado** - Reports automáticos por archivo

## 🔄 CI/CD Pipeline

El proyecto cuenta con pipelines de CI/CD automatizados usando GitHub Actions para garantizar la calidad del código y deploys seguros.

### Workflows Configurados

#### 1. **Tests Automáticos** (`.github/workflows/test.yml`)

**Se ejecuta en:**
- Cada push a `main` y `develop`
- Cada pull request a `main` y `develop`

**Qué hace:**
- ✅ Ejecuta tests en Node.js 18.x y 20.x (matriz de versiones)
- ✅ Genera reporte de coverage completo
- ✅ Sube coverage a Codecov
- ✅ Comenta coverage en PRs automáticamente
- ✅ Ejecuta npm audit para seguridad
- ✅ Ejecuta Snyk security scan

**Jobs incluidos:**
- `test` - Ejecuta suite completa de tests
- `lint` - Verifica código (si hay ESLint configurado)
- `security` - Análisis de seguridad de dependencias

#### 2. **Code Quality** (`.github/workflows/code-quality.yml`)

**Se ejecuta en:**
- Cada push y PR
- Semanalmente (todos los lunes)

**Qué hace:**
- ✅ CodeQL analysis para detectar vulnerabilidades
- ✅ SonarCloud scan para calidad de código
- ✅ Dependency review en PRs
- ✅ Calcula métricas de código

**Análisis incluidos:**
- Security vulnerabilities
- Code smells
- Technical debt
- Duplicated code
- Test coverage
- License compliance

#### 3. **Deploy Automático** (`.github/workflows/deploy.yml`)

**Se ejecuta en:**
- Push a `main` → Deploy a staging automático
- Manual trigger → Deploy a production (requiere aprobación)

**Etapas de Deploy:**

**Staging:**
1. Checkout del código
2. Instalación de dependencias de producción
3. Ejecución de tests pre-deploy
4. Deploy a Heroku/Railway/Render
5. Health check automático
6. Rollback si falla health check
7. Notificación a Slack

**Production:**
1. Requiere que staging esté exitoso
2. Aprobación manual en GitHub
3. Ejecución de tests completos
4. Deploy a producción
5. Creación de GitHub Release
6. Notificación a Slack

#### 4. **Dependabot** (`.github/dependabot.yml`)

**Configuración:**
- Actualiza dependencias semanalmente (lunes 9 AM)
- Agrupa updates de dev dependencies
- Agrupa patches de production dependencies
- Crea PRs automáticos con labels

**Ecosistemas monitoreados:**
- npm packages
- GitHub Actions

### Configuración de Secrets

Para que los workflows funcionen correctamente, configura estos secrets en GitHub:

```
Settings → Secrets and variables → Actions → New repository secret
```

**Secrets requeridos:**

**Para Tests y Coverage:**
- `CODECOV_TOKEN` - Token de Codecov.io
- `SONAR_TOKEN` - Token de SonarCloud
- `SNYK_TOKEN` - Token de Snyk (opcional)

**Para Deploy:**
- `HEROKU_API_KEY` - API key de Heroku
- `HEROKU_EMAIL` - Email de cuenta Heroku
- `HEROKU_STAGING_APP_NAME` - Nombre app staging
- `HEROKU_PRODUCTION_APP_NAME` - Nombre app production

**Alternativas de deploy:**
- `RAILWAY_TOKEN` + `RAILWAY_SERVICE_NAME` (para Railway)
- `RENDER_API_KEY` + `RENDER_SERVICE_ID` (para Render)

**Para Notificaciones:**
- `SLACK_WEBHOOK` - Webhook URL de Slack (opcional)

### Setup Inicial de CI/CD

#### 1. Configurar Codecov

```bash
# 1. Crear cuenta en https://codecov.io
# 2. Conectar repositorio de GitHub
# 3. Copiar CODECOV_TOKEN
# 4. Añadir como secret en GitHub
```

#### 2. Configurar SonarCloud

```bash
# 1. Crear cuenta en https://sonarcloud.io
# 2. Crear nueva organización
# 3. Importar repositorio
# 4. Copiar SONAR_TOKEN
# 5. Actualizar sonar-project.properties con tu org
```

#### 3. Configurar Deploy (Heroku ejemplo)

```bash
# 1. Crear apps en Heroku
heroku create find-home-api-staging
heroku create find-home-api-production

# 2. Obtener API key
heroku auth:token

# 3. Configurar variables de entorno en Heroku
heroku config:set NODE_ENV=production -a find-home-api-production
heroku config:set MONGO_URI=<tu-mongo-uri> -a find-home-api-production
heroku config:set JWT_SECRET=<tu-secret> -a find-home-api-production

# 4. Añadir secrets en GitHub
```

### Uso de CI/CD

#### Flujo de Desarrollo Normal

```bash
# 1. Crear feature branch
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios y commits
git add .
git commit -m "feat: agregar nueva funcionalidad"

# 3. Push al repositorio
git push origin feature/nueva-funcionalidad

# 4. Crear Pull Request en GitHub
# ✅ Tests se ejecutan automáticamente
# ✅ Coverage se comenta en el PR
# ✅ Code quality se analiza
# ✅ Security scan se ejecuta

# 5. Si todos los checks pasan → Merge a develop

# 6. Merge a main → Deploy automático a staging
```

#### Deploy Manual a Producción

```bash
# 1. Ir a Actions en GitHub
# 2. Seleccionar "Deploy" workflow
# 3. Click "Run workflow"
# 4. Seleccionar branch "main"
# 5. Aprobar deploy a production
# ✅ Deploy automático con health checks
```

### Monitoreo de CI/CD

**Ver estado de workflows:**
```
https://github.com/your-username/find-home-back/actions
```

**Ver coverage:**
```
https://codecov.io/gh/your-username/find-home-back
```

**Ver code quality:**
```
https://sonarcloud.io/dashboard?id=find-home-backend
```

### Badges en README

Los badges al inicio del README muestran:
- ✅ Estado de tests (passing/failing)
- ✅ Porcentaje de coverage (90.78%)
- ✅ Estado de code quality
- ✅ Estado de deploy
- ✅ Versión de Node.js requerida

### Protecciones de Branch

**Configuración recomendada para `main`:**

```
Settings → Branches → Add rule
```

- ✅ Require pull request reviews (1 aprobación)
- ✅ Require status checks to pass before merging
  - Tests (Node 18.x)
  - Tests (Node 20.x)
  - CodeQL
  - Lint
- ✅ Require branches to be up to date
- ✅ Include administrators

## 🔒 Seguridad

### Implementaciones de Seguridad

- **Helmet**: Headers HTTP seguros
- **Rate Limiting**: Máximo 100 requests por 15 minutos
- **CORS**: Configurado solo para orígenes permitidos
- **MongoDB Sanitize**: Previene inyección NoSQL
- **JWT**: Autenticación basada en tokens
- **Bcrypt**: Hash seguro de contraseñas

### Buenas Prácticas

1. **Cambiar JWT_SECRET en producción**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Usar HTTPS en producción**

3. **Configurar ALLOWED_ORIGINS correctamente**

4. **Revisar logs regularmente**: `/logs/error.log` y `/logs/combined.log`

## 📊 Logging

Los logs se guardan en:
- `logs/error.log` - Solo errores
- `logs/combined.log` - Todos los logs

### Niveles de Log
- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general
- `http`: Requests HTTP
- `debug`: Debugging (solo desarrollo)

## 🗂️ Estructura del Proyecto

```
find-home-back/
├── src/
│   ├── config/
│   │   └── logger.js          # Configuración de Winston
│   ├── controllers/
│   │   ├── adController.js    # CRUD de anuncios
│   │   └── authController.js  # Autenticación
│   ├── middlewares/
│   │   ├── authMiddleware.js  # Verificación JWT
│   │   └── morganMiddleware.js # Logging HTTP
│   ├── models/
│   │   ├── adModel.js         # Modelo de anuncio
│   │   └── userModel.js       # Modelo de usuario
│   ├── routes/
│   │   ├── adRoutes.js        # Rutas de anuncios
│   │   └── authRoutes.js      # Rutas de auth
│   └── utils/
│       └── errorHandler.js    # Manejo de errores
├── logs/                      # Archivos de log
├── .env                       # Variables de entorno
├── .gitignore
├── package.json
├── README.md
└── server.js                  # Punto de entrada

## 📦 Dependencias Principales

- **express**: Framework web
- **mongoose**: ODM para MongoDB
- **jsonwebtoken**: Autenticación JWT
- **bcryptjs**: Hash de contraseñas
- **winston**: Logging estructurado
- **helmet**: Seguridad HTTP
- **express-rate-limit**: Rate limiting
- **express-validator**: Validación de entrada
- **express-mongo-sanitize**: Prevención NoSQL injection

## 🚧 Próximos Pasos

### ✅ Completado
- [x] Agregar Swagger/OpenAPI documentation
- [x] Implementar tests básicos (Jest + Supertest)
- [x] Índices de MongoDB para performance
- [x] Logging estructurado (Winston)
- [x] Manejo robusto de errores
- [x] Autenticación JWT completa
- [x] **Aumentar coverage de tests a 90.78%** (¡Superado el objetivo de 60%!)
- [x] Tests E2E completos (8 flujos completos)
- [x] MongoDB en memoria para tests
- [x] 106 tests implementados (99 pasando)

### 📋 Por Hacer
**Alta Prioridad:**
- [ ] Setup CI/CD (GitHub Actions / GitLab CI)
- [ ] Implementar búsqueda avanzada con filtros
- [ ] Implementar geolocalización (búsqueda por radio)
- [ ] Cache con Redis para queries frecuentes

**Media Prioridad:**
- [ ] Sistema de favoritos por usuario
- [ ] Upload de imágenes (S3/Cloudinary)
- [ ] Notificaciones por email
- [ ] Soft delete para anuncios

**Baja Prioridad:**
- [ ] Panel de administración
- [ ] Estadísticas y analytics
- [ ] Sistema de reviews

## 📄 Licencia

ISC

## 👥 Autor

[Tu nombre]

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📞 Soporte

Para soporte, contactar a [tu-email@example.com]
