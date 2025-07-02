const TelegramBot = require('node-telegram-bot-api');
const pool = require('../db');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Mapa para almacenar el estado de creación de tarea por usuario
const estadosCreacion = {};

// Comando /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '¡Hola! Soy tu asistente académico. Usa /tareas para ver tus tareas pendientes.');
});

// Comando /tareas
bot.onText(/\/tareas/, async (msg) => {
  const username = msg.from.username;
  if (!username) {
    return bot.sendMessage(msg.chat.id, 'No puedo identificar tu usuario. Configura tu username en Telegram.');
  }
  try {
    const [usuarios] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (!usuarios.length) {
      return bot.sendMessage(msg.chat.id, 'No encontré tu usuario en la app. Asegúrate de que tu username de Telegram coincida con el de la app.');
    }
    const userId = usuarios[0].id;
    const [tareas] = await pool.query(
      'SELECT nombre, tipo, deadline FROM eventos WHERE usuario_id = ? AND completado = 0 ORDER BY deadline',
      [userId]
    );
    if (!tareas.length) {
      return bot.sendMessage(msg.chat.id, '¡No tienes tareas pendientes! 🎉');
    }
    let mensaje = 'Tus tareas pendientes:\n';
    tareas.forEach(t => {
      mensaje += `• ${t.nombre} (${t.tipo}) para el ${t.deadline}\n`;
    });
    bot.sendMessage(msg.chat.id, mensaje);
  } catch (err) {
    bot.sendMessage(msg.chat.id, 'Ocurrió un error al consultar tus tareas.');
  }
});

// Comando /nuevatarea
bot.onText(/\/nuevatarea/, (msg) => {
  estadosCreacion[msg.chat.id] = { paso: 1, datos: {}, username: msg.from.username };
  bot.sendMessage(msg.chat.id, 'Vamos a crear una nueva tarea. ¿Cuál es el nombre de la tarea?');
});

bot.on('message', async (msg) => {
  // Ignorar mensajes que no sean parte del flujo de creación
  if (!estadosCreacion[msg.chat.id] || msg.text.startsWith('/')) return;
  const estado = estadosCreacion[msg.chat.id];

  if (estado.paso === 1) {
    estado.datos.nombre = msg.text;
    estado.paso = 2;
    bot.sendMessage(msg.chat.id, '¿Qué tipo de actividad es? (tarea, examen, proyecto)');
  } else if (estado.paso === 2) {
    const tipo = msg.text.toLowerCase();
    if (!['tarea', 'examen', 'proyecto'].includes(tipo)) {
      return bot.sendMessage(msg.chat.id, 'Tipo no válido. Escribe: tarea, examen o proyecto.');
    }
    estado.datos.tipo = tipo;
    estado.paso = 3;
    bot.sendMessage(msg.chat.id, '¿Para qué fecha y hora? (formato: YYYY-MM-DD HH:mm)');
  } else if (estado.paso === 3) {
    const fecha = msg.text.trim().replace('T', ' ');
    // Validación simple de formato
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(fecha)) {
      return bot.sendMessage(msg.chat.id, 'Formato incorrecto. Usa: YYYY-MM-DD HH:mm (ejemplo: 2025-07-02 14:00)');
    }
    estado.datos.deadline = fecha + ':00';
    // Buscar usuario
    const username = estado.username;
    try {
      const [usuarios] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [username]);
      if (!usuarios.length) {
        bot.sendMessage(msg.chat.id, 'No encontré tu usuario en la app. Asegúrate de que tu username de Telegram coincida con el de la app.');
        delete estadosCreacion[msg.chat.id];
        return;
      }
      const userId = usuarios[0].id;
      // Insertar tarea
      await pool.query(
        'INSERT INTO eventos (usuario_id, nombre, tipo, deadline, completado) VALUES (?, ?, ?, ?, false)',
        [userId, estado.datos.nombre, estado.datos.tipo, estado.datos.deadline]
      );
      bot.sendMessage(msg.chat.id, `¡Tarea creada!\nNombre: ${estado.datos.nombre}\nTipo: ${estado.datos.tipo}\nFecha: ${estado.datos.deadline}`);
    } catch (err) {
      bot.sendMessage(msg.chat.id, 'Ocurrió un error al guardar la tarea.');
    }
    delete estadosCreacion[msg.chat.id];
  }
});

module.exports = bot; 