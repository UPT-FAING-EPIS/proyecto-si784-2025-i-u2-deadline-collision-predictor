const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Cambia por tu contraseña si tienes
  database: 'deadline_collision',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
module.exports = pool; 