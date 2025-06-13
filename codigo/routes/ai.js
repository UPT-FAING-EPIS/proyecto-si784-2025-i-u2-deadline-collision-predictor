const express = require('express');
const router = express.Router();
const moment = require('moment');
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
    const today = moment();
    const tomorrow = moment().add(1, 'days');
    const nextWeek = moment().add(1, 'week');

    // 1. "el jueves 19 de junio" o "jueves 19 de junio"
    let match = text.match(/(?:el\s*)?([a-záéíóúñ]+)\s*(\d{1,2})\s*de\s*([a-záéíóúñ]+)/i);
    if (match) {
        const days = {
            'lunes': 1, 'martes': 2, 'miercoles': 3, 'miércoles': 3, 'jueves': 4,
            'viernes': 5, 'sabado': 6, 'sábado': 6, 'domingo': 0
        };
        const dayOfWeek = days[normalizeDayName(match[1])];
        const day = parseInt(match[2]);
        const month = moment().month(normalizeDayName(match[3]));
        let year = today.year();
        let date = moment([year, month.month(), day]);
        if (date.isBefore(today, 'day')) {
            date = moment([year + 1, month.month(), day]);
        }
        if (date.day() !== dayOfWeek) {
            date = date.day(dayOfWeek);
            if (date.isBefore(today, 'day')) {
                date.add(7, 'days');
            }
        }
        return date;
    }

    // 2. "el 19 de junio"
    match = text.match(/(?:el\s*)?(\d{1,2})\s*de\s*([a-záéíóúñ]+)/i);
    if (match) {
        const day = parseInt(match[1]);
        const month = moment().month(normalizeDayName(match[2]));
        let year = today.year();
        let date = moment([year, month.month(), day]);
        if (date.isBefore(today, 'day')) {
            date = moment([year + 1, month.month(), day]);
        }
        return date;
    }

    // 3. "este lunes", "este sábado" (con o sin tildes)
    match = text.match(/este\s+([a-záéíóúñ]+)/i);
    if (match) {
        const days = {
            'lunes': 1, 'martes': 2, 'miercoles': 3, 'miércoles': 3, 'jueves': 4,
            'viernes': 5, 'sabado': 6, 'sábado': 6, 'domingo': 0
        };
        const targetDay = days[normalizeDayName(match[1])];
        if (typeof targetDay === 'undefined') return null;
        const currentDay = today.day();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        return today.clone().add(daysToAdd, 'days');
    }

    // 4. "el lunes", "el próximo lunes"
    match = text.match(/(?:el|para el|el día|el próximo|el siguiente)?\s*([a-záéíóúñ]+)/i);
    if (match) {
        const days = {
            'lunes': 1, 'martes': 2, 'miercoles': 3, 'miércoles': 3, 'jueves': 4,
            'viernes': 5, 'sabado': 6, 'sábado': 6, 'domingo': 0
        };
        const targetDay = days[normalizeDayName(match[1])];
        if (typeof targetDay === 'undefined') return null;
        const currentDay = today.day();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        return today.clone().add(daysToAdd, 'days');
    }

    // 5. "mañana"
    if (/mañana/i.test(text)) {
        return tomorrow;
    }

    // 6. "la próxima semana" o "siguiente semana"
    if (/la próxima semana|siguiente semana/i.test(text)) {
        return nextWeek;
    }

    // 7. Fechas absolutas tipo 2024-06-19 o 19/06/2024
    match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (match) {
        let day = parseInt(match[1]);
        let month = parseInt(match[2]) - 1;
        let year = parseInt(match[3]);
        if (year < 100) year += 2000;
        return moment([year, month, day]);
    }

    return null;
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
    const cleanText = text
        .replace(/(?:el|para el|el día|el próximo|el siguiente)\s+(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)/gi, '')
        .replace(/(?:el|para el|el día)?\s*\d{1,2}\s*(?:de|del)?\s*(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi, '')
        .replace(/(?:mañana|la próxima semana|siguiente semana)/gi, '')
        .replace(/(?:tengo|necesito|debo|tener|hacer|realizar|entregar)/gi, '')
        .trim();
    return cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
}

router.post('/process', (req, res) => {
    try {
        const { text } = req.body;
        const date = extractDate(text);
        if (!date) {
            return res.status(400).json({
                error: 'No se pudo detectar una fecha válida en el texto'
            });
        }
        const taskData = {
            nombre: extractTaskName(text),
            tipo: determineTaskType(text),
            deadline: date.format('YYYY-MM-DDTHH:mm')
        };
        res.json(taskData);
    } catch (error) {
        console.error('Error procesando el texto:', error);
        res.status(500).json({
            error: 'Error al procesar el texto'
        });
    }
});

module.exports = router;