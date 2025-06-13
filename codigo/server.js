const express = require('express');
const path = require('path');
const app = express();
const taskRoutes = require('./routes/taskRoutes');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/tareas', taskRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
