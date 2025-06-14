const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

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