const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const adController = require("../controllers/adController");
const { authenticate, optionalAuth } = require("../middlewares/authMiddleware");

// Middleware de validación de ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Formato de ID inválido"
    });
  }
  next();
};

// Validaciones completas para crear anuncio
const createAdValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 100 }).withMessage('El título no puede exceder 100 caracteres'),

  body('email')
    .isEmail().withMessage('Debe ser un correo electrónico válido')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('El teléfono es obligatorio')
    .matches(/^\+?[\d\s\-()]+$/).withMessage('Formato de teléfono inválido'),

  body('offer')
    .isIn(['buy', 'rent', 'share'])
    .withMessage("La oferta debe ser 'buy', 'rent' o 'share'"),

  body('price')
    .isFloat({ min: 1 })
    .withMessage('El precio debe ser mayor a 0'),

  body('currency')
    .isIn(['USD', 'EUR', 'GBP'])
    .withMessage("La moneda debe ser 'USD', 'EUR' o 'GBP'"),

  body('property.referenceId')
    .trim()
    .notEmpty().withMessage('El ID de referencia es obligatorio'),

  body('property.characteristics.type')
    .notEmpty().withMessage('El tipo de propiedad es obligatorio'),

  body('property.characteristics.area')
    .isFloat({ min: 1 })
    .withMessage('El área debe ser mayor a 0'),

  body('property.characteristics.bedrooms')
    .isInt({ min: 0 })
    .withMessage('El número de habitaciones debe ser 0 o mayor'),

  body('property.characteristics.bathrooms')
    .isInt({ min: 0 })
    .withMessage('El número de baños debe ser 0 o mayor'),

  body('property.location.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('La latitud debe estar entre -90 y 90'),

  body('property.location.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('La longitud debe estar entre -180 y 180'),

  body('description')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
];

// Validaciones para actualizar anuncio (campos opcionales)
const updateAdValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El título no puede exceder 100 caracteres'),

  body('email')
    .optional()
    .isEmail().withMessage('Debe ser un correo electrónico válido')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-()]+$/).withMessage('Formato de teléfono inválido'),

  body('price')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('El precio debe ser mayor a 0'),

  body('offer')
    .optional()
    .isIn(['buy', 'rent', 'share'])
    .withMessage("La oferta debe ser 'buy', 'rent' o 'share'"),
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * @swagger
 * /api/ads:
 *   get:
 *     tags: [Ads]
 *     summary: Listar todos los anuncios
 *     description: Obtiene una lista paginada de anuncios inmobiliarios
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de items por página
 *     responses:
 *       200:
 *         description: Lista de anuncios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 ads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ad'
 *   post:
 *     tags: [Ads]
 *     summary: Crear nuevo anuncio
 *     description: Crea un nuevo anuncio inmobiliario (requiere autenticación)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ad'
 *     responses:
 *       201:
 *         description: Anuncio creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ad'
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autenticado
 */
router
  .route("/")
  .get(optionalAuth, adController.getAllAds)
  .post(authenticate, createAdValidation, handleValidationErrors, adController.createAd);

/**
 * @swagger
 * /api/ads/{id}:
 *   get:
 *     tags: [Ads]
 *     summary: Obtener anuncio por ID
 *     description: Obtiene un anuncio específico por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del anuncio
 *     responses:
 *       200:
 *         description: Anuncio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ad'
 *       404:
 *         description: Anuncio no encontrado
 *   put:
 *     tags: [Ads]
 *     summary: Actualizar anuncio
 *     description: Actualiza un anuncio existente (requiere autenticación)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del anuncio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ad'
 *     responses:
 *       200:
 *         description: Anuncio actualizado exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Anuncio no encontrado
 *   delete:
 *     tags: [Ads]
 *     summary: Eliminar anuncio
 *     description: Elimina un anuncio (requiere autenticación)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del anuncio
 *     responses:
 *       200:
 *         description: Anuncio eliminado exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Anuncio no encontrado
 */
router
  .route("/:id")
  .get(validateObjectId, optionalAuth, adController.getAdById)
  .put(
    validateObjectId,
    authenticate,
    updateAdValidation,
    handleValidationErrors,
    adController.updateAd
  )
  .delete(validateObjectId, authenticate, adController.deleteAd);

module.exports = router;
