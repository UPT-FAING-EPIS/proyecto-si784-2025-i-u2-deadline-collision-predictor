const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { enviarWhatsApp } = require('../utils/twilio');
const appInsights = require('applicationinsights');

// Obtener eventos del usuario
router.get('/', auth, async (req, res) => {
    try {
        const [eventos] = await pool.query(
            'SELECT * FROM eventos WHERE usuario_id = ? ORDER BY deadline',
            [req.user.id]
        );
        res.json(eventos);
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({ error: 'Error al obtener eventos' });
    }
});

// Crear nuevo evento
router.post('/', auth, async (req, res) => {
    const { nombre, tipo, deadline } = req.body;
    if (!nombre || !tipo || !deadline) return res.status(400).json({ error: 'Faltan datos' });

    // Convertir deadline a formato MySQL DATETIME si viene como 'YYYY-MM-DDTHH:mm'
    let fecha = deadline.replace('T', ' ');
    if (fecha.length === 16) fecha += ':00'; // Añadir segundos si faltan

    try {
        const [result] = await pool.query(
            'INSERT INTO eventos (usuario_id, nombre, tipo, deadline, completado) VALUES (?, ?, ?, ?, false)',
            [req.user.id, nombre, tipo, fecha]
        );

        // Track event creation
        appInsights.defaultClient.trackEvent({
            name: 'EventCreated',
            properties: {
                userId: req.user.id,
                username: req.user.username,
                eventType: tipo,
                eventName: nombre,
                deadline: fecha,
                timestamp: new Date().toISOString()
            }
        });

        // Enviar WhatsApp si el usuario tiene teléfono
        const [usuarios] = await pool.query('SELECT telefono, username FROM usuarios WHERE id = ?', [req.user.id]);
        if (usuarios.length && usuarios[0].telefono) {
            const mensaje = `¡Hola! Se ha registrado una nueva tarea: "${nombre}" (${tipo}) para el ${fecha}.`;
            try {
                await enviarWhatsApp(usuarios[0].telefono, mensaje);
            } catch (err) {
                console.error('Error enviando WhatsApp:', err.message);
            }
            // Verificar colisión: ¿hay más de una actividad ese día?
            const [tareasMismoDia] = await pool.query(
                'SELECT nombre, tipo, deadline FROM eventos WHERE usuario_id = ? AND DATE(deadline) = DATE(?) ORDER BY deadline',
                [req.user.id, fecha]
            );
            if (tareasMismoDia.length > 1) {
                let mensajeColision = `¡Atención ${usuarios[0].username}! Tienes varias actividades el ${fecha.split(' ')[0]}:\n`;
                for (const tarea of tareasMismoDia) {
                    mensajeColision += `- ${tarea.nombre} (${tarea.tipo}) a las ${new Date(tarea.deadline).toLocaleTimeString()}\n`;
                }
                mensajeColision += '¡Organízate para evitar conflictos!';
                try {
                    await enviarWhatsApp(usuarios[0].telefono, mensajeColision);
                } catch (err) {
                    console.error('Error enviando WhatsApp de colisión:', err.message);
                }
            }
        }
        res.json({ 
            mensaje: 'Evento guardado',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al guardar evento:', error);
        res.status(500).json({ error: 'Error al guardar evento' });
    }
});

// Actualizar estado de completado
router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { completado } = req.body;

    try {
        await pool.query(
            'UPDATE eventos SET completado = ? WHERE id = ? AND usuario_id = ?',
            [completado, id, req.user.id]
        );

        // Track event completion status change
        appInsights.defaultClient.trackEvent({
            name: 'EventStatusChanged',
            properties: {
                userId: req.user.id,
                username: req.user.username,
                eventId: id,
                completed: completado,
                timestamp: new Date().toISOString()
            }
        });

        res.json({ mensaje: 'Evento actualizado' });
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        res.status(500).json({ error: 'Error al actualizar evento' });
    }
});

// Eliminar evento
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(
            'DELETE FROM eventos WHERE id = ? AND usuario_id = ?',
            [id, req.user.id]
        );

        // Track event deletion
        appInsights.defaultClient.trackEvent({
            name: 'EventDeleted',
            properties: {
                userId: req.user.id,
                username: req.user.username,
                eventId: id,
                timestamp: new Date().toISOString()
            }
        });

        res.json({ mensaje: 'Evento eliminado' });
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        res.status(500).json({ error: 'Error al eliminar evento' });
    }
});

// Nueva ruta para obtener colisiones de eventos
router.get('/colisiones', auth, async (req, res) => {
    try {
        const [colisionesRaw] = await pool.query(
            `SELECT DATE(deadline) as fecha_colision
             FROM eventos
             WHERE usuario_id = ?
             GROUP BY DATE(deadline), usuario_id
             HAVING COUNT(*) > 1`,
            [req.user.id]
        );

        if (colisionesRaw.length === 0) {
            return res.json([]); // No hay colisiones
        }

        // Obtener todos los eventos para las fechas con colisiones
        const fechasColision = colisionesRaw.map(c => c.fecha_colision);
        const [eventosConColision] = await pool.query(
            `SELECT id, nombre, tipo, deadline, completado
             FROM eventos
             WHERE usuario_id = ? AND DATE(deadline) IN (?)
             ORDER BY deadline`,
            [req.user.id, fechasColision]
        );

        res.json(eventosConColision);
    } catch (error) {
        console.error('Error al obtener colisiones de eventos:', error);
        res.status(500).json({ error: 'Error al obtener colisiones de eventos' });
    }
});

module.exports = router; 