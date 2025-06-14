const express = require('express');
const router = express.Router();
const moment = require('moment');
const pool = require('../db');
const auth = require('../middleware/auth');
require('moment/locale/es');
moment.locale('es');

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
    console.log('extractDate: Input text:', text);
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
        console.log('extractDate: Pattern 1 match. Date:', date.format('YYYY-MM-DD'));
    } 
    // 2. "el jueves 19 de junio" o "jueves 19 de junio"
    else if (match = text.match(/(?:el\s*)?([a-záéíóúñ]+)\s*(\d{1,2})\s*de\s*([a-záéíóúñ]+)/i)) {
        const day = parseInt(match[2]);
        const monthName = normalizeDayName(match[3]);
        const month = moment().month(monthName);
        console.log(`extractDate: Pattern 2 - Month Name: ${match[3]}, Normalized Month Name: ${monthName}, Moment Month Index: ${month.month()}`);
        let year = today.year();
        date = moment([year, month.month(), day]);
        console.log(`extractDate: Pattern 2 - Initial Date: ${date.format('YYYY-MM-DD')}, Is Before Today: ${date.isBefore(today, 'day')}`);
        if (date.isBefore(today, 'day')) {
            date = moment([year + 1, month.month(), day]);
            console.log('extractDate: Pattern 2 - Adjusted to next year. Date:', date.format('YYYY-MM-DD'));
        }
        console.log('extractDate: Pattern 2 match. Date:', date.format('YYYY-MM-DD'));
    }
    // 3. "el 19 de junio"
    else if (match = text.match(/(?:el\s*)?(\d{1,2})\s*de\s*([a-záéíóúñ]+)/i)) {
        const day = parseInt(match[1]);
        const monthName = normalizeDayName(match[2]);
        const month = moment().month(monthName);
        let year = today.year();
        date = moment([year, month.month(), day]);
        if (date.isBefore(today, 'day')) {
            date = moment([year + 1, month.month(), day]);
        }
        console.log('extractDate: Pattern 3 match. Date:', date.format('YYYY-MM-DD'));
    }
    // 4. "mañana"
    else if (/mañana/i.test(text)) {
        date = tomorrow;
        console.log('extractDate: Pattern 4 match (mañana). Date:', date.format('YYYY-MM-DD'));
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
        console.log('extractDate: Pattern 5 match (este dia). Date:', date ? date.format('YYYY-MM-DD') : 'null');
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
            if (daysToAdd <= 0) daysToAdd += 7; // Asegurarse de que sea siempre la "próxima" semana si el día actual es el mismo o posterior
            date = today.clone().add(daysToAdd, 'days');
        }
        console.log('extractDate: Pattern 6 match (el dia). Date:', date ? date.format('YYYY-MM-DD') : 'null');
    }
    // 7. "la próxima semana" o "siguiente semana"
    else if (/la próxima semana|siguiente semana/i.test(text)) {
        date = nextWeek;
        console.log('extractDate: Pattern 7 match (proxima semana). Date:', date.format('YYYY-MM-DD'));
    }

    // Si no se detectó ninguna fecha explícita, se asume hoy.
    if (!date) {
        date = today.clone();
        console.log('extractDate: No explicit date found, defaulting to today. Date:', date.format('YYYY-MM-DD'));
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
        console.log('extractDate: Time matched. Final Date with time:', date.format('YYYY-MM-DDTHH:mm'));
    } else if (date && !timeMatch) {
        console.log('extractDate: No time matched. Final Date without time:', date.format('YYYY-MM-DD'));
    }

    console.log('extractDate: Returning date. isValid:', date ? date.isValid() : 'N/A');
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
    console.log('extractTaskName: Input text:', text);

    // Paso 1: Eliminar todos los patrones de fecha y hora del texto
    let cleanedText = text
        .replace(/(?:el\s*)?([a-záéíóúñ]+)\s*(\d{1,2})\s*de\s*([a-záéíóúñ]+)/gi, '') // ej. "el jueves 19 de junio"
        .replace(/(?:el\s*)?(\d{1,2})\s*de\s*([a-záéíóúñ]+)/gi, '') // ej. "el 19 de junio"
        .replace(/este\s+([a-záéíóúñ]+)/gi, '') // ej. "este lunes"
        .replace(/mañana/gi, '')
        .replace(/la próxima semana|siguiente semana/gi, '')
        .replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/gi, '') // ej. "2024-06-19" o "19/06/2024"
        .replace(/(?:a las|las)?\s*(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?/gi, ''); // ej. "a las 8 am"
    
    console.log('extractTaskName: After date/time removal:', cleanedText.trim());

    // Paso 2: Eliminar las frases introductorias que señalan la acción de agregar una tarea.
    const introductoryRegex = /^(?:agrega|crea|añade|registrar|tengo|necesito|debo|tener|hacer|realizar|entregar|que\s+tengo)\s*(?:una\s+|un\s+|el\s+|la\s+)?/i;
    cleanedText = cleanedText.replace(introductoryRegex, '').trim();

    console.log('extractTaskName: After introductory phrase removal:', cleanedText);

    if (cleanedText.length === 0) {
        console.log('extractTaskName: Returning "Tarea sin nombre" due to empty string.');
        return 'Tarea sin nombre'; 
    }

    console.log('extractTaskName: Final cleaned text:', cleanedText);
    return cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1);
}

// Route to process AI requests for tasks
router.post('/process', auth, async (req, res) => {
    try {
        const { text } = req.body;
        const userId = req.user.id; // Obtener el ID del usuario de la solicitud autenticada

        console.log('Received text for /process:', text);
        const date = extractDate(text);
        console.log('Extracted date:', date ? date.format('YYYY-MM-DDTHH:mm') : 'null', 'isValid:', date ? date.isValid() : 'N/A');

        if (!date || !date.isValid()) {
            return res.status(400).json({
                error: 'Lo siento, no pude detectar una fecha válida en tu mensaje. Por favor, especifica una fecha como "mañana", "el lunes" o "el 15 de junio".'
            });
        }

        const taskData = {
            nombre: extractTaskName(text),
            fecha: date.format('YYYY-MM-DD'),
            tipo: determineTaskType(text),
            hora: date.isValid() ? date.format('HH:mm') : null // Extraer la hora si la fecha es válida
        };

        // Insertar en la base de datos
        const query = 'INSERT INTO eventos (nombre, fecha, hora, tipo, usuario_id) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const values = [taskData.nombre, taskData.fecha, taskData.hora, taskData.tipo, userId];
        const result = await pool.query(query, values);
        const newEvent = result.rows[0];

        console.log('Sending response to frontend. Task Name:', taskData.nombre, 'Date:', taskData.fecha); // Nuevo log
        res.json({ message: 'Evento guardado exitosamente.', event: newEvent });

    } catch (error) {
        console.error('Error processing AI request:', error); // Log de error
        res.status(500).json({ error: 'Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.' });
    }
});

// Endpoint para la detección de colisiones
router.get('/eventos/colisiones', auth, async (req, res) => {
    try {
        const { fecha, hora, duracion } = req.query; // Asumiendo que la duración está en minutos
        const userId = req.user.id;

        if (!fecha || !hora || !duracion) {
            return res.status(400).json({ error: 'Faltan parámetros para la detección de colisiones (fecha, hora, duracion).' });
        }

        const eventDateTime = moment(`${fecha} ${hora}`);
        const eventEndDateTime = eventDateTime.clone().add(parseInt(duracion), 'minutes');

        // Consulta para eventos que se superponen con el nuevo evento
        const checkCollisionQuery = `
            SELECT id, nombre, fecha, hora, duracion_estimada
            FROM eventos
            WHERE usuario_id = $1
            AND fecha = $2
            ORDER BY hora
        `;

        const { rows: existingEvents } = await pool.query(checkCollisionQuery, [userId, fecha]);

        const collisions = existingEvents.filter(event => {
            const existingEventStart = moment(`${event.fecha} ${event.hora}`);
            const existingEventDuration = event.duracion_estimada || 60; // Por defecto 60 minutos si no está establecido
            const existingEventEnd = existingEventStart.clone().add(existingEventDuration, 'minutes');

            // Verificar superposición
            return (
                (eventDateTime.isBefore(existingEventEnd) && eventEndDateTime.isAfter(existingEventStart))
            );
        });

        if (collisions.length > 0) {
            return res.json({ hasCollision: true, collisions: collisions });
        } else {
            return res.json({ hasCollision: false });
        }

    } catch (error) {
        console.error('Error al detectar colisiones:', error);
        res.status(500).json({ error: 'Hubo un error al detectar colisiones.' });
    }
});

module.exports = router;
