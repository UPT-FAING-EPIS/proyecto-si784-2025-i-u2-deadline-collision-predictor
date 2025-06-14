const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = 'supersecreto'; // cámbialo en producción

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
    const [users] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (users.length) return res.status(400).json({ error: 'Usuario ya existe' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO usuarios (username, password_hash) VALUES (?, ?)', [username, hash]);
    res.json({ mensaje: 'Usuario registrado' });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
    const [users] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    if (!users.length) return res.status(400).json({ error: 'Usuario no encontrado' });
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Contraseña incorrecta' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
});

module.exports = router; 