require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const eventosRoutes = require('./routes/eventos');
const aiRouter = require('./routes/ai');
const dashboardRoutes = require('./routes/dashboard');
const horarioRoutes = require('./routes/horario');
const moodleRoutes = require('./routes/moodle');
require('./utils/telegramBot');

const app = express();

console.log('Iniciando aplicación...');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/ai', aiRouter);
app.use('/api/moodle', moodleRoutes);
app.use('/api', horarioRoutes);
app.use('/', dashboardRoutes);

// Ruta principal
app.get('/', (req, res) => {
    console.log('Ruta / solicitada');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
