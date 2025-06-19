const sharp = require('sharp');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const moment = require('moment');
const pool = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const upload = multer({ dest: 'uploads/' });

// POST /api/horario-universitario
router.post('/horario-universitario', auth, async (req, res) => {
  try {
    const { cursos, fechaInicio, fechaFin } = req.body;
    const userId = req.user.id;
    const eventos = [];

    cursos.forEach(curso => {
      curso.dias.forEach(diaSemana => {
        let fecha = moment(fechaInicio).day(diaSemana);
        if (fecha.isBefore(moment(fechaInicio))) fecha.add(1, 'week');
        while (fecha.isSameOrBefore(moment(fechaFin))) {
          eventos.push({
            nombre: curso.nombre,
            fecha: fecha.format('YYYY-MM-DD'),
            hora: curso.horaInicio,
            tipo: 'clase',
            origen: 'horario_universitario',
            usuario_id: userId
          });
          fecha.add(1, 'week');
        }
      });
    });

    for (const evento of eventos) {
      await pool.query(
        'INSERT INTO eventos (nombre, fecha, hora, tipo, origen, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
        [evento.nombre, evento.fecha, evento.hora, evento.tipo, evento.origen, evento.usuario_id]
      );
    }

    res.json({ message: 'Horario universitario agregado exitosamente.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al agregar horario universitario.' });
  }
});

// POST /api/horario-universitario-img
router.post('/horario-universitario-img', auth, upload.single('imagen'), async (req, res) => {
  try {
    const { path } = req.file;
    const userId = req.user.id;
    const processedPath = path + '-processed.png';

    // Mejora la imagen
    
    await sharp(path)
      .resize({ width: 1600 }) // Aumenta resolución horizontal
      .grayscale()
      .modulate({ brightness: 1.2, contrast: 1.5 }) // Ajuste fino de brillo/contraste
      .sharpen()
      .normalize() // Normaliza la imagen para mejorar el contraste
      .threshold(200) // Binariza (ajusta si la imagen queda muy negra o muy blanca)
      .toFormat('png') 
      .toFile(processedPath);


    // Enviar imagen a OCR.space
    const form = new FormData();
    form.append('file', fs.createReadStream(processedPath));
    form.append('language', 'spa');
    form.append('apikey', 'helloworld'); // Clave demo pública
    form.append('isOverlayRequired', 'false');

    const response = await axios.post('https://api.ocr.space/parse/image', form, {
      headers: form.getHeaders()
    });

    const texto = response.data.ParsedResults[0]?.ParsedText || '';
    console.log('Texto OCR (OCR.space):', texto);

    const eventosDetectados = parseHorarioTexto(texto);

    fs.unlinkSync(path);
    fs.unlinkSync(processedPath);

    res.json({ eventos: eventosDetectados, texto });
  } catch (error) {
    console.error('Error OCR (OCR.space):', error.message);
    res.status(500).json({ error: 'Error al procesar la imagen con OCR.space.' });
  }
});

function parseHorarioTexto(texto) {
  const eventos = [];
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  let cursoActual = null;

  const horaRegex = /\d{2}:\d{2}/g;

  lineas.forEach(linea => {
    // Si la línea contiene un código tipo SL-085, asumimos que es un nuevo curso
    if (/^[A-Z]{2}-\d{3}/i.test(linea)) {
      cursoActual = {
        codigo: linea.split(' ')[0],
        curso: linea.replace(/^[A-Z]{2}-\d{3}\s*/i, ''),
        horas: []
      };
    } else if (cursoActual && horaRegex.test(linea)) {
      // Si hay horas y hay curso actual, asociamos
      const horas = linea.match(horaRegex);
      for (let i = 0; i < horas.length; i += 2) {
        const horaInicio = horas[i];
        const horaFin = horas[i + 1] || null;

        if (horaInicio && horaFin) {
          eventos.push({
            codigo: cursoActual.codigo,
            curso: cursoActual.curso,
            dia: 'Sin definir', // Aquí podrías intentar deducir por posición si el OCR es más limpio
            horaInicio,
            horaFin
          });
        }
      }
    } else if (cursoActual) {
      // A veces el nombre del curso continúa en la línea siguiente
      cursoActual.curso += ' ' + linea;
    }
  });

  return eventos;
}

module.exports = router;
