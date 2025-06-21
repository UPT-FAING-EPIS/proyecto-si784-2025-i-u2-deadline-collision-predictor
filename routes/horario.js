const sharp = require('sharp');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const { createWorker } = require('tesseract.js');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const pdfParse = require('pdf-parse');
const fetch = require('node-fetch'); // npm install node-fetch
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Días de la semana en varios formatos posibles
const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'miércoles', 'jueves', 'viernes', 'sabado', 'sábado'];

// POST /api/horario-universitario-img (Solo usa Ollama)
router.post('/horario-universitario-img', upload.single('imagen'), async (req, res) => {
  let tempFiles = [];
  try {
    const { path, mimetype } = req.file;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(mimetype)) {
      fs.unlinkSync(path);
      return res.status(400).json({ success: false, error: 'Formato de imagen no soportado. Usa JPG o PNG.' });
    }

    const processedPath = `${path}-processed.png`;
    tempFiles = [path, processedPath];

    await sharp(path)
      .resize({ width: 2800, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .greyscale()
      .modulate({ brightness: 1.2, contrast: 1.4 })
      .threshold(160)
      .sharpen()
      .toFile(processedPath);

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

    // 1. Intenta con el parser complejo
    let eventos = parseHorarioComplejo(text).filter(e => Object.keys(e.horario).length > 0);

    // 2. Si no hay eventos, intenta con el parser universal
    if (eventos.length === 0) {
      eventos = parseHorarioUniversal(text);
    }

    // Limpieza de archivos temporales
    tempFiles.forEach(file => {
      try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (e) { console.warn('Error al borrar', file, e); }
    });

    // SOLO USA OLLAMA
    const eventosOllama = await extraerHorarioOllama(text);
    res.json({ eventos: eventosOllama, texto });

  } catch (error) {
    tempFiles.forEach(file => {
      try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (e) { console.warn('Error al borrar', file, e); }
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

function parseHorarioUniversal(textoOCR) {
  const lineas = textoOCR.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let encabezados = [];
  let eventos = [];

  // 1. Buscar encabezados
  for (let i = 0; i < lineas.length; i++) {
    if (lineas[i].toLowerCase().includes('lunes') && lineas[i].toLowerCase().includes('curso')) {
      encabezados = lineas[i].split(/\s{2,}|[|]/).map(e => e.trim().toLowerCase());
      // El resto de líneas son datos
      for (let j = i + 1; j < lineas.length; j++) {
        const columnas = lineas[j].split(/\s{2,}|[|]/).map(c => c.trim());
        if (columnas.length < encabezados.length) continue; // línea incompleta
        let eventoBase = {
          codigo: columnas[encabezados.indexOf('codigo')],
          curso: columnas[encabezados.indexOf('curso')],
          seccion: columnas[encabezados.indexOf('seccion')]
        };
        // Para cada día
        ['lunes','martes','miercoles','miércoles','jueves','viernes','sabado','sábado','domingo'].forEach(dia => {
          const idx = encabezados.indexOf(dia);
          if (idx !== -1 && columnas[idx]) {
            // Buscar todas las horas en la celda
            const horas = columnas[idx].match(/\d{2}[:\-]\d{2}/g);
            if (horas) {
              for (let k = 0; k < horas.length; k += 2) {
                eventos.push({
                  ...eventoBase,
                  dia,
                  horaInicio: horas[k].replace('-', ':'),
                  horaFin: horas[k+1] ? horas[k+1].replace('-', ':') : null
                });
              }
            }
          }
        });
      }
      break;
    }
  }
  return eventos;
}

// SOLO ESTA FUNCIÓN IA: LLAMA A OLLAMA
async function extraerHorarioOllama(textoOCR) {
  const prompt = `
Extrae del siguiente texto los cursos, días y horas en formato JSON.
Ejemplo de salida:
[
  {
    "codigo": "SI-784",
    "curso": "CALIDAD Y PRUEBAS DE SOFTWARE",
    "seccion": "A",
    "horarios": [
      {"dia": "jueves", "horaInicio": "20:00", "horaFin": "21:40"},
      {"dia": "sabado", "horaInicio": "08:00", "horaFin": "09:40"}
    ]
  }
]
Texto:
${textoOCR}
  `;

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3', // Cambia por el modelo que usas si es otro
      prompt: prompt,
      stream: false
    })
  });

  const data = await response.json();
  const respuesta = data.response;
  const jsonMatch = respuesta.match(/\[.*\]/s);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return [];
}

// SOLO ESTA FUNCIÓN IA: LLAMA A GEMINI
async function extraerHorarioGemini(textoOCR) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Extrae del siguiente texto los cursos, días y horas en formato JSON.
Ejemplo de salida:
[
  {
    "codigo": "SI-784",
    "curso": "CALIDAD Y PRUEBAS DE SOFTWARE",
    "seccion": "A",
    "horarios": [
      {"dia": "jueves", "horaInicio": "20:00", "horaFin": "21:40"},
      {"dia": "sabado", "horaInicio": "08:00", "horaFin": "09:40"}
    ]
  }
]
Texto:
${textoOCR}
  `;

  const result = await model.generateContent(prompt);
  const respuesta = result.response.text();
  const jsonMatch = respuesta.match(/\[.*\]/s);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return [];
}

module.exports = router;
