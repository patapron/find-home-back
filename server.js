require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const adRoutes = require("./src/routes/adRoutes");
const { errorHandler } = require("./src/utils/errorHandler");
// const { validateAd } = require("./middlewares/validationMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parsear JSON en las peticiones

// Conexión a MongoDB
mongoose
  // .connect(process.env.MONGO_URI, {
  .connect("mongodb://localhost:27017/find-home", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error conectando a MongoDB:", err));

// Rutas
app.use("/api/ads", adRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar el servidor
app.listen(PORT, "0.0.0.0", (err) => {
  if (err) {
    console.error("Error al iniciar el servidor:", err);
    process.exit(1);
  }
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Conexión a MongoDB cerrada");
  process.exit(0);
});
