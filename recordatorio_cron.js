require('dotenv').config();
const cron = require('node-cron');
const pool = require('./db');
const { enviarWhatsApp } = require('./utils/twilio');

// Ejecuta todos los días a las 8:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Buscando tareas próximas para enviar recordatorios...');
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const yyyy = manana.getFullYear();
  const mm = String(manana.getMonth() + 1).padStart(2, '0');
  const dd = String(manana.getDate()).padStart(2, '0');
  const fechaManana = `${yyyy}-${mm}-${dd}`;

  try {
    const [tareas] = await pool.query(
      `SELECT e.nombre, e.tipo, e.deadline, u.telefono, u.username
       FROM eventos e
       JOIN usuarios u ON e.usuario_id = u.id
       WHERE DATE(e.deadline) = ? AND u.telefono IS NOT NULL`,
      [fechaManana]
    );

    for (const tarea of tareas) {
      const mensaje = `¡Hola ${tarea.username}! Recuerda que tienes la tarea "${tarea.nombre}" (${tarea.tipo}) para mañana (${tarea.deadline}).`;
      try {
        await enviarWhatsApp(tarea.telefono, mensaje);
        console.log(`Recordatorio enviado a ${tarea.telefono}`);
      } catch (err) {
        console.error('Error enviando WhatsApp:', err.message);
      }
    }
    if (tareas.length === 0) {
      console.log('No hay tareas para mañana.');
    }
  } catch (err) {
    console.error('Error consultando tareas:', err.message);
  }
});

console.log('Recordatorio automático programado. El proceso está corriendo...'); 