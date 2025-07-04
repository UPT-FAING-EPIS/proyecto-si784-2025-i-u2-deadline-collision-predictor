const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { google } = require('googleapis');

const JWT_SECRET = 'supersecreto'; // cámbialo en producción
const CLIENT_ID = '32626470363-2nl2av8oh8q7m12fe0aa7v5turp8foeq.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://deadline-collision-b4212dd6072a.herokuapp.com/api/google/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

router.post('/register', async (req, res) => {
    const { username, password, telefono } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
    const [users] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (users.length) return res.status(400).json({ error: 'Usuario ya existe' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO usuarios (username, password_hash, telefono) VALUES (?, ?, ?)', [username, hash, telefono || null]);
    res.json({ mensaje: 'Usuario registrado' });
});

router.post('/login', async (req, res) => {
    const { username, password, telefono } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
    const [users] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    if (!users.length) return res.status(400).json({ error: 'Usuario no encontrado' });
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Contraseña incorrecta' });
    if (telefono && (!user.telefono || user.telefono !== telefono)) {
        await pool.query('UPDATE usuarios SET telefono = ? WHERE id = ?', [telefono, user.id]);
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
});

// Endpoint para iniciar el flujo OAuth2
router.get('/google/auth', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar'
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
  res.redirect(url);
});

// Endpoint de callback de Google
router.get('/google/callback', async (req, res) => {
  const code = req.query.code;
  const username = req.query.username; // El frontend debe pasar el username como query param
  if (!code) return res.status(400).send('No se recibió el código de Google');
  if (!username) return res.status(400).send('Falta el username para asociar el token');
  try {
    const { tokens } = await oauth2Client.getToken(code);
    // Guardar tokens en la base de datos asociados al usuario
    await pool.query('UPDATE usuarios SET google_token = ? WHERE username = ?', [JSON.stringify(tokens), username]);
    res.send('¡Integración con Google Calendar exitosa! Puedes cerrar esta ventana.');
  } catch (err) {
    res.status(500).send('Error intercambiando el código: ' + err.message);
  }
});

module.exports = router; 