const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { google } = require('googleapis');
const appInsights = require('applicationinsights');

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
    
    try {
        const [users] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [username]);
        if (users.length) return res.status(400).json({ error: 'Usuario ya existe' });
        
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO usuarios (username, password_hash, telefono) VALUES (?, ?, ?)', [username, hash, telefono || null]);
        
        // Track user registration
        appInsights.defaultClient.trackEvent({
            name: 'UserRegistered',
            properties: {
                userId: result.insertId,
                username: username,
                hasPhone: !!telefono,
                timestamp: new Date().toISOString()
            }
        });
        
        res.json({ mensaje: 'Usuario registrado' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password, telefono } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
    
    try {
        const [users] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
        if (!users.length) return res.status(400).json({ error: 'Usuario no encontrado' });
        
        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(400).json({ error: 'Contraseña incorrecta' });
        
        if (telefono && (!user.telefono || user.telefono !== telefono)) {
            await pool.query('UPDATE usuarios SET telefono = ? WHERE id = ?', [telefono, user.id]);
        }
        
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
        
        // Track user login
        appInsights.defaultClient.trackEvent({
            name: 'UserLoggedIn',
            properties: {
                userId: user.id,
                username: user.username,
                hasPhone: !!user.telefono,
                timestamp: new Date().toISOString()
            }
        });
        
        res.json({ token });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

module.exports = router; 