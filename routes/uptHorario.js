const express = require("express");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const pool = require("../db");
const auth = require("../middleware/auth");
const moment = require("moment");
const appInsights = require("applicationinsights");

// POST para ejecutar Python y extraer horario
router.post("/", async (req, res) => {
  const { codigo, password } = req.body;

  if (!codigo || !password) {
    return res.status(400).json({ error: "Faltan datos." });
  }

  try {
    const response = await axios.post("http://161.132.45.140:3000/", {
      codigo,
      password,
    }, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Track schedule extraction
    appInsights.defaultClient.trackEvent({
      name: 'ScheduleExtracted',
      properties: {
        codigo: codigo,
        success: true,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      mensaje: "Horario extraído correctamente desde el servidor.",
      data: response.data,
    });
  } catch (error) {
    console.error("❌ Error contactando al servidor Debian:", error.message);
    
    // Track failed extraction
    appInsights.defaultClient.trackEvent({
      name: 'ScheduleExtractionFailed',
      properties: {
        codigo: codigo,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });

    res.status(500).json({ error: "No se pudo extraer el horario desde el servidor remoto." });
  }
});

// POST para subir el horario (requiere autenticación)
router.post("/subir/:codigo", auth, async (req, res) => {
  const codigo = req.params.codigo;
  const { desde, hasta, horario } = req.body;

  if (!desde || !hasta) {
    return res.status(400).json({ error: "Faltan fechas 'desde' y 'hasta'." });
  }

  // Usa el horario recibido en el body si existe
  let clases = horario;
  if (!clases) {
    const jsonPath = path.join(__dirname, `../scripts/horarios_json/${codigo}.json`);
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: "Archivo JSON no encontrado." });
    }
    const raw = fs.readFileSync(jsonPath);
    clases = JSON.parse(raw);
  }

  // Validar que clases es un array
  console.log("Horario recibido para subir:", clases);
  if (!Array.isArray(clases) || clases.length === 0) {
    return res.status(400).json({ error: "El horario recibido no es válido o está vacío." });
  }

  const diasSemana = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
    domingo: 0,
  };

  const eventos = [];

  for (const clase of clases) {
    for (const [dia, horarioRaw] of Object.entries(clase)) {
      if (!diasSemana.hasOwnProperty(dia)) continue;
      if (!horarioRaw) continue;

      let horario = horarioRaw.trim();

      if (!horario.includes("-") && horario.length === 10) {
        horario = horario.slice(0, 5) + "-" + horario.slice(5);
      }

      if (!horario.includes("-")) continue;

      const [horaInicio] = horario.split("-").map((h) => h.trim());
      const dayNum = diasSemana[dia];

      let fechaActual = moment(desde);
      const fechaFin = moment(hasta);

      while (fechaActual.isSameOrBefore(fechaFin)) {
        if (fechaActual.day() === dayNum) {
          const fechaEvento = fechaActual.format("YYYY-MM-DD") + "T" + horaInicio;

          eventos.push([
            req.user.id,
            `${clase.curso} (${clase.seccion})`,
            "clase",
            fechaEvento,
          ]);
        }
        fechaActual.add(1, "day");
      }
    }
  }

  // Validar que hay eventos para insertar
  console.log("Eventos a insertar:", eventos);
  if (eventos.length === 0) {
    return res.status(400).json({ error: "No se generaron eventos para insertar." });
  }

  const insertQuery = `
    INSERT INTO eventos (usuario_id, nombre, tipo, deadline)
    VALUES ?
  `;

  try {
    await pool.query(insertQuery, [eventos]);
    
    // Track schedule upload
    appInsights.defaultClient.trackEvent({
      name: 'ScheduleUploaded',
      properties: {
        userId: req.user.id,
        username: req.user.username,
        codigo: codigo,
        eventsCount: eventos.length,
        dateRange: `${desde} to ${hasta}`,
        timestamp: new Date().toISOString()
      }
    });

    res.json({ mensaje: `✅ Se registraron ${eventos.length} clases como eventos.` });
  } catch (err) {
    console.error("❌ Error insertando en la base de datos:", err);
    
    // Track upload failure
    appInsights.defaultClient.trackEvent({
      name: 'ScheduleUploadFailed',
      properties: {
        userId: req.user.id,
        username: req.user.username,
        codigo: codigo,
        error: err.message,
        timestamp: new Date().toISOString()
      }
    });

    res.status(500).json({ error: "Error al guardar los eventos en la base de datos." });
  }
});

// GET para descargar JSON
router.get("/download/json/:codigo", (req, res) => {
  const codigo = req.params.codigo;
  const filePath = path.join(__dirname, `../scripts/horarios_json/${codigo}.json`);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "Archivo JSON no encontrado." });
  }
});

// GET para descargar Excel
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
