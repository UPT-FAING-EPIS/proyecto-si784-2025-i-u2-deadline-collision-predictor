const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const { createWorker } = require('tesseract.js');

const upload = multer({ dest: 'uploads/' });

// POST /ocr
router.post('/ocr', upload.single('imagen'), async (req, res) => {
  const tempFiles = [];

  try {
    const { path, mimetype } = req.file;

    // Validar tipo de imagen
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(mimetype)) {
      fs.unlinkSync(path);
      return res.status(400).json({ success: false, error: 'Formato no soportado. Usa JPG o PNG.' });
    }

    const processedPath = `${path}-processed.png`;
    tempFiles.push(path, processedPath);

    // Preprocesar imagen con sharp
    await sharp(path)
      .resize({ width: 2800, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .greyscale()
      .modulate({ brightness: 1.2, contrast: 1.4 })
      .threshold(160)
      .sharpen()
      .toFile(processedPath);

    // Inicializar worker de Tesseract
    const worker = await createWorker('spa');
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_blacklist: '¡¿[]|<>\\/',
      preserve_interword_spaces: '1',
      user_defined_dpi: '300'
    });

    const { data: { text } } = await worker.recognize(processedPath);
    await worker.terminate();

    // Limpiar archivos temporales
    tempFiles.forEach(file => {
      try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (_) {}
    });

    res.json({ success: true, texto: text });

  } catch (error) {
    tempFiles.forEach(file => {
      try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (_) {}
    });

    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
