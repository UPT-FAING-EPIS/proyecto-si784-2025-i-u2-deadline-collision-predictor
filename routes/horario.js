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

    // 1. Preprocesamiento de imagen optimizado para tablas complejas
    await sharp(path)
      .resize({ 
        width: 2800,  // Resolución óptima para tablas
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } 
      })
      .greyscale()
      .modulate({ brightness: 1.2, contrast: 1.4 })
      .threshold(160)  // Umbral óptimo para mantener líneas de tabla
      .sharpen()
      .toFile(processedPath);

    // 2. Configuración avanzada de Tesseract para tablas irregulares
    // 2. Configuración avanzada de Tesseract para tablas irregulares
      const worker = await createWorker('spa');
      await worker.setParameters({
        tessedit_pageseg_mode: '6',
        tessedit_char_blacklist: '¡¿[]|<>\\/',
        preserve_interword_spaces: '1',
        tessedit_ocr_engine_mode: '3',  // LSTM + OCR
        user_defined_dpi: '300'  // Para mejor calidad de imagen
      });


    const { data: { text } } = await worker.recognize(processedPath);
    await worker.terminate();

    console.log('Texto OCR Mejorado:', text);
    
    // 3. Procesamiento inteligente del texto con manejo de casos complejos
    const eventos = parseHorarioComplejo(text);
    
    // 4. Limpieza de archivos temporales
    tempFiles.forEach(file => {
      try { fs.unlinkSync(file); } catch (e) { console.warn('Error al borrar', file, e); }
    });

    res.json({ 
      success: true,
      eventos: eventos.filter(e => Object.keys(e.horario).length > 0) // Filtra cursos sin horario
    });

  } catch (error) {
    // Limpieza en caso de error
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

// Nueva ruta para PDF
router.post('/api/horario-universitario-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    // Aquí puedes usar una función similar a parseHorarioComplejo para procesar data.text
    const eventos = parseHorarioComplejo(data.text); // Reutiliza tu lógica de parseo
    fs.unlinkSync(req.file.path);
    res.json({ success: true, eventos });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Función mejorada para parsear tablas complejas
function parseHorarioComplejo(textoOCR) {
  const lineas = textoOCR.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  const eventos = [];
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  let cursoActual = null;

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    // Busca líneas que parecen un curso (código al inicio)
    const codigoMatch = linea.match(/^([A-Z]{2,3}-?\d{3})/i);
    if (codigoMatch) {
      // Si hay uno anterior, lo guardamos
      if (cursoActual) eventos.push(cursoActual);

      cursoActual = {
        codigo: codigoMatch[1],
        nombre: linea.replace(codigoMatch[1], '').replace(/\d{1,2}:\d{2}/g, '').replace(/[A-Z]\s*$/, '').trim(),
        seccion: '',
        horario: {}
      };
      dias.forEach(dia => cursoActual.horario[dia] = '');
      // Busca horas en la misma línea
      const horas = [...linea.matchAll(/\d{1,2}:\d{2}/g)].map(m => m[0]);
      horas.forEach((hora, idx) => {
        if (dias[idx]) cursoActual.horario[dias[idx]] = hora;
      });
    } else if (cursoActual) {
      // Si la línea tiene horas, las agregamos en orden
      const horas = [...linea.matchAll(/\d{1,2}:\d{2}/g)].map(m => m[0]);
      let diaIdx = Object.values(cursoActual.horario).filter(h => h).length;
      horas.forEach((hora, idx) => {
        if (dias[diaIdx]) cursoActual.horario[dias[diaIdx]] = hora;
        diaIdx++;
      });
      // Si la línea no tiene horas, puede ser parte del nombre
      if (horas.length === 0 && linea.length > 3) {
        cursoActual.nombre += ' ' + linea.trim();
      }
    }
  }
  if (cursoActual) eventos.push(cursoActual);
  return eventos;
}

// Normaliza nombres de días
function normalizarDia(dia) {
  const mapaDias = {
    'miercoles': 'miercoles',
    'miércoles': 'miercoles',
    'mercedes': 'miercoles',
    'sabado': 'sabado',
    'sábado': 'sabado'
  };
  return mapaDias[dia.toLowerCase()] || dia.toLowerCase();
}

// Limpieza de texto para comparación
function cleanString(str) {
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f¡¿|\[\]<>]/g, "")
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = router;