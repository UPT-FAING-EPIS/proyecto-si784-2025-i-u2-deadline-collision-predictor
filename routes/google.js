const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const pool = require('../db');

const CLIENT_ID = '32626470363-2nl2av8oh8q7m12fe0aa7v5turp8foeq.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://deadline-collision-b4212dd6072a.herokuapp.com/api/google/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Endpoint para iniciar el flujo OAuth2
router.get('/auth', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar'
  ];
  const username = req.query.username;
  if (!username) return res.status(400).send('Falta el username para iniciar la vinculación');
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: username
  });
  res.redirect(url);
});

// Endpoint de callback de Google
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const username = req.query.state;
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