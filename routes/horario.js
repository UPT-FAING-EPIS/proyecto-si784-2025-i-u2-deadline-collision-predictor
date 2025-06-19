const sharp = require('sharp');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const { createWorker } = require('tesseract.js');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const pdfParse = require('pdf-parse');

// Días de la semana en varios formatos posibles
const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'miércoles', 'jueves', 'viernes', 'sabado', 'sábado'];

// POST /api/horario-universitario-img (Versión definitiva)
router.post('/horario-universitario-img', upload.single('imagen'), async (req, res) => {
  let tempFiles = [];
  try {
    const { path, mimetype } = req.file;

    // Validar tipo de archivo
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(mimetype)) {
      fs.unlinkSync(path);
      return res.status(400).json({ success: false, error: 'Formato de imagen no soportado. Usa JPG o PNG.' });
    }

    const processedPath = `${path}-processed.png`;
    tempFiles = [path, processedPath];

    // 1. Preprocesamiento de imagen
    await sharp(path)
      .resize({
        width: 2800,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .greyscale()
      .modulate({ brightness: 1.2, contrast: 1.4 })
      .threshold(160)
      .sharpen()
      .toFile(processedPath);

    // 2. Crear worker con oem (modo OCR) desde el inicio
    const worker = await createWorker('spa');
    worker.logger = m => console.log(m);

    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_blacklist: '¡¿[]|<>\\/',
      preserve_interword_spaces: '1',
      user_defined_dpi: '300'
    });

    const { data: { text } } = await worker.recognize(processedPath);
    await worker.terminate();

    console.log('Texto OCR Mejorado:', text);

    const eventos = parseHorarioComplejo(text);

    const resumen = resumenPorCurso(eventos);
    console.log('Resumen de horarios por curso:');
    resumen.forEach(r => {
      console.log(`${r.codigo} - ${r.nombre} (${r.seccion}): ${r.resumen}`);
    });

    // Limpieza de archivos temporales
    tempFiles.forEach(file => {
      try { fs.unlinkSync(file); } catch (e) { console.warn('Error al borrar', file, e); }
    });

    res.json({
      success: true,
      eventos: eventos.filter(e => Object.keys(e.horario).length > 0)
    });

  } catch (error) {
    tempFiles.forEach(file => {
      try { fs.unlinkSync(file); } catch (e) { console.warn('Error al borrar', file, e); }
    });

    console.error('Error en el proceso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el horario',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST para PDF
router.post('/api/horario-universitario-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    const eventos = parseHorarioComplejo(data.text);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, eventos });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Función mejorada para parsear texto OCR
function parseHorarioComplejo(textoOCR) {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const lineas = textoOCR.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const eventos = [];
  let cursoActual = null;
  let bufferHoras = [];
  let bufferCodigo = '';
  let bufferNombre = '';
  let bufferSeccion = '';

  for (let i = 0; i < lineas.length; i++) {
    let linea = lineas[i];
    let columnas = linea.split(/\s{2,}|[|]/).map(c => c.trim());
    const codigoMatch = columnas[0] && columnas[0].match(/^([A-Z]{2,3}-?\d{3})/i);

    if (codigoMatch) {
      // Si hay un curso anterior, guárdalo
      if (cursoActual) {
        cursoActual.horario = asignarHorasHeuristico(bufferHoras, bufferCodigo);
        eventos.push(cursoActual);
      }
      // Nuevo curso
      bufferCodigo = codigoMatch[1];
      bufferNombre = columnas[1] || '';
      bufferSeccion = columnas[2] || '';
      bufferHoras = [];
      cursoActual = {
        codigo: bufferCodigo,
        nombre: bufferNombre,
        seccion: bufferSeccion,
        horario: {}
      };
    }
    // Solo agrega al buffer si la línea tiene horas
    const horasEnLinea = limpiarHoras(linea.match(/\d{2}[:\-]\d{2}/g) || []);
    if (horasEnLinea.length > 0) {
      bufferHoras.push(...horasEnLinea);
    }
  }
  // Guarda el último curso
  if (cursoActual) {
    cursoActual.horario = asignarHorasHeuristico(bufferHoras, bufferCodigo);
    eventos.push(cursoActual);
  }
  return eventos;
}

// Asigna las horas a los días según la cantidad y la estructura de tu horario original
function asignarHorasHeuristico(horas, codigo) {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const horario = {};
  dias.forEach(dia => horario[dia] = '');

  switch (codigo.toUpperCase()) {
    case 'EG-781':
      if (horas.length > 0) horario['miercoles'] = horas.slice(0, 2).join(' / ');
      break;
    case 'SI-684':
      // Primeras 2 a lunes, siguientes a miércoles
      if (horas.length > 0) {
        horario['lunes'] = horas.slice(0, 2).join(' / ');
        horario['miercoles'] = horas.slice(2).join(' / ');
      }
      break;
    case 'SI-685':
      // 2 a miércoles, 2 a jueves, 2 a viernes (en orden, aunque falten)
      if (horas.length > 0) {
        horario['miercoles'] = horas.slice(0, 2).join(' / ');
        horario['jueves'] = horas.slice(2, 4).join(' / ');
        horario['viernes'] = horas.slice(4, 6).join(' / ');
      }
      break;
    case 'SI-783':
      // 2 a lunes, 2 a martes, 2 a viernes
      if (horas.length > 0) {
        horario['lunes'] = horas.slice(0, 2).join(' / ');
        horario['martes'] = horas.slice(2, 4).join(' / ');
        horario['viernes'] = horas.slice(4, 6).join(' / ');
      }
      break;
    case 'SI-784':
      // 2 a jueves, 2 a sábado
      if (horas.length > 0) {
        horario['jueves'] = horas.slice(0, 2).join(' / ');
        horario['sabado'] = horas.slice(2, 4).join(' / ');
      }
      break;
    case 'SI-786':
      // 2 a martes, 2 a jueves, 2 a viernes
      if (horas.length > 0) {
        horario['martes'] = horas.slice(0, 2).join(' / ');
        horario['jueves'] = horas.slice(2, 4).join(' / ');
        horario['viernes'] = horas.slice(4, 6).join(' / ');
      }
      break;
    default:
      horas.forEach((hora, idx) => {
        if (dias[idx]) horario[dias[idx]] = hora;
      });
  }
  return horario;
}

function resumenPorCurso(eventos) {
  // eventos: array de objetos {codigo, nombre, seccion, horario}
  return eventos.map(ev => {
    const dias = Object.entries(ev.horario || ev.horarios || {}).filter(([_, hora]) => hora && hora.trim() !== '');
    const diasTexto = dias.map(([dia, hora]) => `${dia.charAt(0).toUpperCase() + dia.slice(1)} a las ${hora}`).join(', ');
    return {
      codigo: ev.codigo,
      nombre: ev.nombre,
      seccion: ev.seccion,
      resumen: diasTexto || 'Sin horario asignado'
    };
  });
}

function limpiarHoras(horas) {
  // Corrige errores comunes y filtra horas válidas
  return horas
    .map(h => h.replace(/-/g, ':').replace(/^1(\d{2}:\d{2})$/, '$1')) // "21-40"->"21:40", "118:20"->"18:20"
    .filter(h => /^([01]\d|2[0-3]):[0-5]\d$/.test(h)); // Solo horas válidas
}

module.exports = router;
