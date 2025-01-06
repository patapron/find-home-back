const { body, validationResult } = require("express-validator");

// Middleware de validación para la creación de productos
exports.validateProduct = [
  body("name")
    .isLength({ min: 3 })
    .withMessage("El nombre es obligatorio y debe tener al menos 3 caracteres"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("El precio es obligatorio y no puede ser negativo"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
