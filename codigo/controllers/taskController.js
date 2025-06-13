const db = require('../database');

const getTareas = (req, res) => {
  db.query('SELECT * FROM tareas', (err, results) => {
    if (err) {
      console.error('Error al obtener tareas:', err);
      return res.status(500).json({ error: 'Error al leer tareas' });
    }
    res.json(results);
  });
};

const addTarea = (req, res) => {
  const { nombre, tipo, inicio, fin } = req.body;

  if (!nombre || !tipo || !inicio || !fin) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const sql = 'INSERT INTO tareas (nombre, tipo, inicio, fin) VALUES (?, ?, ?, ?)';
  db.query(sql, [nombre, tipo, inicio, fin], (err, result) => {
    if (err) {
      console.error('Error al insertar tarea:', err);
      return res.status(500).json({ error: 'Error al guardar tarea' });
    }
    res.status(201).json({ mensaje: '✅ Tarea registrada' });
  });
};

module.exports = { getTareas, addTarea };
