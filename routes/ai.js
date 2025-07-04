const express = require('express');
const router = express.Router();
const moment = require('moment');
const pool = require('../db');
const auth = require('../middleware/auth');
require('moment/locale/es');
moment.locale('es');
const { Configuration, OpenAIApi } = require('openai');
const { OpenAI } = require('openai');

function normalizeDayName(day) {
    return day
        .toLowerCase()
        .replace(/[á]/g, 'a')
        .replace(/[é]/g, 'e')
        .replace(/[í]/g, 'i')
        .replace(/[ó]/g, 'o')
        .replace(/[ú]/g, 'u');
}

function extractDate(text) {
    console.log('extractDate: Input text:', text); // Nuevo log
    const today = moment();
    const tomorrow = moment().add(1, 'days');
    const nextWeek = moment().add(1, 'week');

    let date = null;

    let match;

    // 1. Fechas absolutas tipo 2024-06-19 o 19/06/2024 (Prioridad alta)
    match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (match) {
        let day = parseInt(match[1]);
        let month = parseInt(match[2]) - 1;
        let year = parseInt(match[3]);
        if (year < 100) year += 2000; // Asume años de 2 dígitos son del 2000
        date = moment([year, month, day]);
        console.log('extractDate: Pattern 1 match. Date:', date.format('YYYY-MM-DD')); // Nuevo log
    } 
    // 2. "el jueves 19 de junio" o "jueves 19 de junio"
    else if (match = text.match(/(?:el\s*)?([a-záéíóúñ]+)\s*(\d{1,2})\s*de\s*([a-záéíóúñ]+)/i)) {
        const day = parseInt(match[2]);
        const month = moment().month(normalizeDayName(match[3]));
        let year = today.year();
        date = moment([year, month.month(), day]);
        if (date.isBefore(today, 'day')) {
            date = moment([year + 1, month.month(), day]);
        }
        console.log('extractDate: Pattern 2 match. Date:', date.format('YYYY-MM-DD')); // Nuevo log
    }
    // 3. "el 19 de junio"
    else if (match = text.match(/(?:el\s*)?(\d{1,2})\s*de\s*([a-záéíóúñ]+)/i)) {
        const day = parseInt(match[1]);
        const month = moment().month(normalizeDayName(match[2]));
        let year = today.year();
        date = moment([year, month.month(), day]);
        if (date.isBefore(today, 'day')) {
            date = moment([year + 1, month.month(), day]);
        }
        console.log('extractDate: Pattern 3 match. Date:', date.format('YYYY-MM-DD')); // Nuevo log
    }
    // 4. "mañana"
    else if (/mañana/i.test(text)) {
        date = tomorrow;
        console.log('extractDate: Pattern 4 match (mañana). Date:', date.format('YYYY-MM-DD')); // Nuevo log
    }
    // 5. "este lunes", "este sábado" (con o sin tildes)
    else if (match = text.match(/este\s+(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i)) {
        const days = {
            'lunes': 1, 'martes': 2, 'miercoles': 3, 'miércoles': 3, 'jueves': 4,
            'viernes': 5, 'sabado': 6, 'sábado': 6, 'domingo': 0
        };
        const targetDay = days[normalizeDayName(match[1])];
        if (typeof targetDay !== 'undefined') {
            const currentDay = today.day();
            let daysToAdd = targetDay - currentDay;
            if (daysToAdd < 0) daysToAdd += 7;
            date = today.clone().add(daysToAdd, 'days');
        }
        console.log('extractDate: Pattern 5 match (este dia). Date:', date ? date.format('YYYY-MM-DD') : 'null'); // Nuevo log
    }
    // 6. "el lunes", "el próximo lunes"
    else if (match = text.match(/(?:el|para el|el día|el próximo|el siguiente)\s+(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i)) {
        const days = {
            'lunes': 1, 'martes': 2, 'miercoles': 3, 'miércoles': 3, 'jueves': 4,
            'viernes': 5, 'sabado': 6, 'sábado': 6, 'domingo': 0
        };
        const targetDay = days[normalizeDayName(match[1])];
        if (typeof targetDay !== 'undefined') {
            const currentDay = today.day();
            let daysToAdd = targetDay - currentDay;
            if (daysToAdd <= 0) daysToAdd += 7;
            date = today.clone().add(daysToAdd, 'days');
        }
        console.log('extractDate: Pattern 6 match (el dia). Date:', date ? date.format('YYYY-MM-DD') : 'null'); // Nuevo log
    }
    // 7. "la próxima semana" o "siguiente semana"
    else if (/la próxima semana|siguiente semana/i.test(text)) {
        date = nextWeek;
        console.log('extractDate: Pattern 7 match (proxima semana). Date:', date.format('YYYY-MM-DD')); // Nuevo log
    }

    // Si no se detectó ninguna fecha explícita, se asume hoy.
    if (!date) {
        date = today.clone();
        console.log('extractDate: No explicit date found, defaulting to today. Date:', date.format('YYYY-MM-DD')); // Nuevo log
    }

    // Extraer la hora si está presente en el texto (se aplica a cualquier fecha detectada)
    const timeMatch = text.match(/(?:a las|las)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (date && timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : '';

        if (ampm === 'pm' && hours < 12) {
            hours += 12;
        } else if (ampm === 'am' && hours === 12) { // 12 AM is 00 hours
            hours = 0;
        }
        date.hour(hours).minute(minutes).second(0).millisecond(0);
        console.log('extractDate: Time matched. Final Date with time:', date.format('YYYY-MM-DDTHH:mm')); // Nuevo log
    } else if (date && !timeMatch) {
        console.log('extractDate: No time matched. Final Date without time:', date.format('YYYY-MM-DD')); // Nuevo log
    }

    console.log('extractDate: Returning date. isValid:', date ? date.isValid() : 'N/A'); // Nuevo log
    return date;
}

function determineTaskType(text) {
    const types = {
        'examen': /examen|prueba|evaluación|test/i,
        'proyecto': /proyecto|trabajo final|entrega final/i,
        'tarea': /tarea|deber|ejercicio|actividad/i
    };
    for (const [type, regex] of Object.entries(types)) {
        if (regex.test(text)) {
            return type;
        }
    }
    return 'tarea';
}

function extractTaskName(text) {
    console.log('extractTaskName: Input text:', text); // Nuevo log

    // Paso 1: Eliminar todos los patrones de fecha y hora del texto
    let cleanedText = text
        .replace(/(?:el\s*)?([a-záéíóúñ]+)\s*(\d{1,2})\s*de\s*([a-záéíóúñ]+)/gi, '') // ej. "el jueves 19 de junio"
        .replace(/(?:el\s*)?(\d{1,2})\s*de\s*([a-záéíóúñ]+)/gi, '') // ej. "el 19 de junio"
        .replace(/este\s+([a-záéíóúñ]+)/gi, '') // ej. "este lunes"
        .replace(/mañana/gi, '')
        .replace(/la próxima semana|siguiente semana/gi, '')
        .replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/gi, '') // ej. "2024-06-19" o "19/06/2024"
        .replace(/(?:a las|las)?\s*(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?/gi, ''); // ej. "a las 8 am"
    
    console.log('extractTaskName: After date/time removal:', cleanedText.trim()); // Nuevo log

    // Paso 2: Eliminar las frases introductorias que señalan la acción de agregar una tarea.
    // Hacemos esta regex menos agresiva para no eliminar el nombre de la tarea.
    const introductoryRegex = /^(?:agrega|crea|añade|registrar|tengo|necesito|debo|tener|hacer|realizar|entregar|que\s+tengo)\s*(?:una\s+|un\s+|el\s+|la\s+)?/i;
    cleanedText = cleanedText.replace(introductoryRegex, '').trim();

    console.log('extractTaskName: After introductory phrase removal:', cleanedText);

    if (cleanedText.length === 0) {
        console.log('extractTaskName: Returning "Tarea sin nombre" due to empty string.'); // Nuevo log
        return 'Tarea sin nombre'; 
    }

    console.log('extractTaskName: Final cleaned text:', cleanedText);
    return cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1);
}

function getCurrentDate() {
    return moment().format('YYYY-MM-DD');
}

function getTomorrowDate() {
    return moment().add(1, 'days').format('YYYY-MM-DD');
}

// Configuración de OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

router.post('/process', (req, res) => {
    try {
        const { text } = req.body;
        console.log('Received text for /process:', text); // Debugging log
        const date = extractDate(text);
        console.log('Extracted date:', date ? date.format('YYYY-MM-DDTHH:mm') : 'null', 'isValid:', date ? date.isValid() : 'N/A'); // Debugging log
        if (!date) {
            return res.status(400).json({
                error: 'No se pudo detectar ninguna fecha en el texto proporcionado.'
            });
        }
        if (!date.isValid()) {
            return res.status(400).json({
                error: `La fecha detectada es inválida: ${date.format('YYYY-MM-DDTHH:mm')} (Texto original: "${text}")`
            });
        }
        const taskData = {
            nombre: extractTaskName(text),
            tipo: determineTaskType(text),
            deadline: date.format('YYYY-MM-DDTHH:mm')
        };
        res.json(taskData);
    } catch (error) {
        console.error('Error procesando el texto en /process:', error);
        res.status(500).json({
            error: 'Error interno al procesar el texto: ' + error.message
        });
    }
});

router.get('/tomorrow-events', auth, async (req, res) => {
    try {
        const tomorrow = getTomorrowDate();
        const today = getCurrentDate();
        
        // Consultar eventos para mañana
        const [eventos] = await pool.query(
            `SELECT * FROM eventos 
             WHERE usuario_id = ? 
             AND DATE(deadline) = ?`,
            [req.user.id, tomorrow]
        );

        // Formatear los eventos para la respuesta
        const eventosFormateados = eventos.map(evento => ({
            id: evento.id,
            nombre: evento.nombre,
            tipo: evento.tipo,
            deadline: moment(evento.deadline).format('YYYY-MM-DD HH:mm'),
            creado_en: moment(evento.creado_en).format('YYYY-MM-DD HH:mm')
        }));

        res.json({
            fecha_actual: today,
            fecha_mañana: tomorrow,
            eventos: eventosFormateados,
            total_eventos: eventosFormateados.length
        });
    } catch (error) {
        console.error('Error al obtener eventos de mañana:', error);
        res.status(500).json({
            error: 'Error al procesar la solicitud de eventos'
        });
    }
});

router.post('/ask', auth, async (req, res) => {
    try {
        const { pregunta } = req.body;
        if (!pregunta) {
            return res.status(400).json({ error: 'La pregunta es requerida' });
        }

        // Convertir la pregunta a minúsculas para facilitar el análisis
        const preguntaLower = pregunta.toLowerCase();

        // Detectar si la pregunta es sobre mañana
        if (preguntaLower.includes('mañana')) {
            const tomorrow = getTomorrowDate();
            
            // Consultar eventos para mañana
            const [eventos] = await pool.query(
                `SELECT * FROM eventos 
                 WHERE usuario_id = ? 
                 AND DATE(deadline) = ?`,
                [req.user.id, tomorrow]
            );

            // Formatear los eventos
            const eventosFormateados = eventos.map(evento => ({
                nombre: evento.nombre,
                tipo: evento.tipo,
                hora: moment(evento.deadline).format('HH:mm')
            }));

            if (eventosFormateados.length === 0) {
                return res.json({
                    respuesta: "No tienes ningún evento programado para mañana."
                });
            }

            // Construir respuesta natural
            let respuesta = "Para mañana tienes los siguientes eventos:\n";
            eventosFormateados.forEach(evento => {
                respuesta += `- ${evento.nombre} (${evento.tipo}) a las ${evento.hora}\n`;
            });

            return res.json({ respuesta });
        }

        // Si no se detecta una pregunta sobre mañana
        return res.json({
            respuesta: "Lo siento, solo puedo responder preguntas sobre eventos de mañana. Por ejemplo: '¿Qué eventos tengo mañana?' o '¿Tengo examen mañana?'"
        });

    } catch (error) {
        console.error('Error al procesar la pregunta:', error);
        res.status(500).json({
            error: 'Error al procesar la pregunta'
        });
    }
});

router.post('/openai', auth, async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Falta el nombre de la tarea' });
    try {
        const prompt = `Resuelve la siguiente tarea de manera detallada y paso a paso: ${nombre}`;
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Eres un asistente académico experto en resolver tareas universitarias.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 600
        });
        const respuesta = completion.choices[0].message.content;
        res.json({ respuesta });
    } catch (error) {
        console.error('Error con OpenAI:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al obtener respuesta de OpenAI' });
    }
});

module.exports = router;