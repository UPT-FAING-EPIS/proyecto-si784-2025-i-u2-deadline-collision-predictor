const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.post('/horario', async (req, res) => {
  try {
    console.log('Proxy: datos recibidos', req.body);
    const response = await fetch('http://161.132.45.140:3000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    console.log('Proxy: status', response.status, 'body:', text);
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { error: 'Respuesta no es JSON', raw: text };
    }
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy: error', err);
    res.status(500).json({ error: 'Error al consultar la API de horario', detalle: err.message });
  }
});

module.exports = router; 