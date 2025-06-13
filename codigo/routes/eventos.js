const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM eventos WHERE usuario_id = ?', [req.user.id]);
    res.json(rows);
});

router.post('/', auth, async (req, res) => {
    const { nombre, tipo, deadline } = req.body;
    if (!nombre || !tipo || !deadline) return res.status(400).json({ error: 'Faltan datos' });

    // Convertir deadline a formato MySQL DATETIME si viene como 'YYYY-MM-DDTHH:mm'
    let fecha = deadline.replace('T', ' ');
    if (fecha.length === 16) fecha += ':00'; // Añadir segundos si faltan

    await pool.query(
        'INSERT INTO eventos (usuario_id, nombre, tipo, deadline) VALUES (?, ?, ?, ?)',
        [req.user.id, nombre, tipo, fecha]
    );
    res.json({ mensaje: 'Evento guardado' });
});

module.exports = router; 