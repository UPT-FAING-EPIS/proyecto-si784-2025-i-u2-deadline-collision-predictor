const fs = require('fs');
const path = require('path');
const tareasPath = path.join(__dirname, '../data/tareas.json');

const getTareas = (req, res) => {
  const data = fs.existsSync(tareasPath) ? fs.readFileSync(tareasPath) : '[]';
  res.json(JSON.parse(data));
};

const addTarea = (req, res) => {
  const nuevaTarea = req.body;
  const data = fs.existsSync(tareasPath) ? fs.readFileSync(tareasPath) : '[]';
  const tareas = JSON.parse(data);
  tareas.push(nuevaTarea);
  fs.writeFileSync(tareasPath, JSON.stringify(tareas, null, 2));
  res.status(201).json({ mensaje: 'Tarea guardada con éxito' });
};

module.exports = { getTareas, addTarea };
