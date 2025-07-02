require('dotenv').config();
const cron = require('node-cron');
const pool = require('./db');
const { enviarWhatsApp } = require('./utils/twilio');

// Ejecuta todos los días a las 8:10 AM
cron.schedule('10 8 * * *', async () => {
  console.log('Buscando colisiones de tareas para enviar notificaciones...');
  try {
    // Buscar fechas con colisión (más de una tarea/examen/proyecto el mismo día por usuario)
    const [colisiones] = await pool.query(`
      SELECT e.usuario_id, u.telefono, u.username, DATE(e.deadline) as fecha_colision
      FROM eventos e
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE u.telefono IS NOT NULL
      GROUP BY e.usuario_id, DATE(e.deadline)
      HAVING COUNT(*) > 1
    `);

    for (const colision of colisiones) {
      // Obtener todas las tareas de ese usuario para esa fecha
      const [tareas] = await pool.query(`
        SELECT nombre, tipo, deadline
        FROM eventos
        WHERE usuario_id = ? AND DATE(deadline) = ?
        ORDER BY deadline
      `, [colision.usuario_id, colision.fecha_colision]);

      if (tareas.length > 1) {
        let mensaje = `¡Atención ${colision.username}! Tienes varias actividades el ${colision.fecha_colision}:
`;
        for (const tarea of tareas) {
          mensaje += `- ${tarea.nombre} (${tarea.tipo}) a las ${tarea.deadline.toLocaleString()}
`;
        }
        mensaje += '¡Organízate para evitar conflictos!';
        try {
          await enviarWhatsApp(colision.telefono, mensaje);
          console.log(`Notificación de colisión enviada a ${colision.telefono}`);
        } catch (err) {
          console.error('Error enviando WhatsApp:', err.message);
        }
      }
    }
    if (colisiones.length === 0) {
      console.log('No hay colisiones de tareas hoy.');
    }
  } catch (err) {
    console.error('Error consultando colisiones:', err.message);
  }
});

console.log('Recordatorio de colisiones programado. El proceso está corriendo...'); 