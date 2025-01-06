// src/server/controllers/advertisementController.js
const Ad = require("../models/adModel");

// Obtener todos los anuncios
exports.getAllAds = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Parámetros de consulta para paginación
    const ads = await Ad.find()
      .skip((page - 1) * limit) // Salta los documentos de páginas anteriores
      .limit(limit); // Límite de documentos por página
    const total = await Ad.countDocuments();
    res.status(200).json({ total, page, ads });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un anuncio por ID
exports.getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id); // Busca directamente por _id
    if (!ad) return res.status(404).json({ message: "Anuncio no encontrado" });
    res.status(200).json(ad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo anuncio
exports.createAd = async (req, res) => {
  const ad = new Ad(req.body);
  try {
    await ad.save();
    res.status(201).json(ad);
  } catch (error) {
    res.status(400).json({
      message: "Error al crear el anuncio",
      errors: error.errors, // Esto incluye los errores de validación de Mongoose
    });
  }
};

// Actualizar un anuncio
exports.updateAd = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Devuelve el documento actualizado
      runValidators: true, // Ejecuta validaciones del esquema en los datos nuevos
    });
    if (!ad) return res.status(404).json({ message: "Anuncio no encontrado" });
    res.status(200).json(ad);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar un anuncio
exports.deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ message: "Anuncio no encontrado" });
    res.status(200).json({ message: "Anuncio eliminado", ad });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
