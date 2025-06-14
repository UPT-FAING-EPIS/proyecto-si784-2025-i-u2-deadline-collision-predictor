const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || '161.132.45.140',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'Upt2025', // Cambia por tu contraseña si tienes
  database: process.env.DB_NAME || 'deadline_collision',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
module.exports = pool;