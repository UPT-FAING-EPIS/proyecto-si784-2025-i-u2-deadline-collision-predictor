const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.post('/horario', async (req, res) => {
  try {
    const response = await fetch('http://161.132.45.140:3000/api/horario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar la API de horario' });
  }
});

module.exports = router; 