const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '161.132.45.140',
  user: 'admin',
  password: 'Upt2025', // Cambia por tu contraseña si tienes
  database: 'deadline_collision',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
module.exports = pool;