// src/server/routes/adRoutes.js
const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const adController = require("../controllers/adController");

// Middlewares
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "ID no válido" });
  }
  next();
};

const validateAd = [
  check("title").notEmpty().withMessage("El título es obligatorio"),
  check("email").isEmail().withMessage("Debe ser un correo válido"),
  check("phone").isNumeric().withMessage("El teléfono debe ser numérico"),
  check("price")
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número positivo"),
  check("offer")
    .isIn(["buy", "rent", "share"])
    .withMessage("La oferta debe ser 'buy', 'rent' o 'share'"),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Rutas CRUD
router
  .route("/")
  .get(adController.getAllAds)
  .post(validateAd, handleValidationErrors, adController.createAd);

router
  .route("/:id")
  .get(validateObjectId, adController.getAdById)
  .put(
    validateObjectId,
    validateAd,
    handleValidationErrors,
    adController.updateAd
  )
  .delete(validateObjectId, adController.deleteAd);

module.exports = router;
