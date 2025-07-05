const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Ruta POST: Ejecuta el script de Python
router.post("/", (req, res) => {
  const { codigo, password } = req.body;

  if (!codigo || !password) {
    return res.status(400).json({ error: "Faltan datos." });
  }

  const scriptPath = path.join(__dirname, "../scripts/scrape_horario.py");

  const comando = `python "${scriptPath}" ${codigo} ${password}`;
  console.log("🛠️ Ejecutando:", comando);

  exec(comando, { timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Error al ejecutar Python:", error.message);
      return res.status(500).json({ error: "Fallo en la extracción del horario." });
    }

    const jsonPath = path.join(__dirname, `../scripts/horarios_json/${codigo}.json`);
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: "No se encontró el archivo JSON generado." });
    }

    res.json({ mensaje: "Horario extraído correctamente." });
  });
});

// Ruta para descargar JSON
router.get("/download/json/:codigo", (req, res) => {
  const codigo = req.params.codigo;
  const filePath = path.join(__dirname, `../scripts/horarios_json/${codigo}.json`);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "Archivo JSON no encontrado." });
  }
});

// Ruta para descargar Excel
router.get("/download/excel/:codigo", (req, res) => {
  const codigo = req.params.codigo;
  const filePath = path.join(__dirname, `../scripts/horarios_excel/${codigo}.xlsx`);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "Archivo Excel no encontrado." });
  }
});

module.exports = router;
