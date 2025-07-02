const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db');
const auth = require('../middleware/auth');
const moment = require('moment');

// Configuración de Moodle
const MOODLE_CONFIG = {
    baseURL: process.env.MOODLE_URL || 'https://moodle.example.com',
    token: process.env.MOODLE_TOKEN || '',
    service: 'moodle_mobile_app'
};

// Función para hacer peticiones a la API de Moodle
async function moodleRequest(wsfunction, params = {}) {
    try {
        const url = `${MOODLE_CONFIG.baseURL}/webservice/rest/server.php`;
        const response = await axios.get(url, {
            params: {
                wstoken: MOODLE_CONFIG.token,
                moodlewsrestformat: 'json',
                wsfunction: wsfunction,
                ...params
            },
            timeout: 10000
        });
        return response.data;
    } catch (error) {
        console.error('Error en petición a Moodle:', error.message);
        throw new Error(`Error de conexión con Moodle: ${error.message}`);
    }
}

// Obtener cursos del usuario
router.get('/courses', auth, async (req, res) => {
    try {
        const courses = await moodleRequest('core_enrol_get_users_courses', {
            userid: req.user.moodle_user_id || 0
        });

        // Guardar cursos en la base de datos local
        for (const course of courses) {
            await pool.query(
                `INSERT INTO moodle_courses (course_id, user_id, fullname, shortname, summary, startdate, enddate) 
                 VALUES (?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 fullname = VALUES(fullname), 
                 shortname = VALUES(shortname), 
                 summary = VALUES(summary), 
                 startdate = VALUES(startdate), 
                 enddate = VALUES(enddate)`,
                [
                    course.id,
                    req.user.id,
                    course.fullname,
                    course.shortname,
                    course.summary || '',
                    course.startdate ? moment.unix(course.startdate).format('YYYY-MM-DD') : null,
                    course.enddate ? moment.unix(course.enddate).format('YYYY-MM-DD') : null
                ]
            );
        }

        res.json({
            success: true,
            courses: courses,
            message: `${courses.length} cursos sincronizados`
        });
    } catch (error) {
        console.error('Error obteniendo cursos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener tareas de un curso específico
router.get('/assignments/:courseId', auth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const assignments = await moodleRequest('mod_assign_get_assignments', {
            courseids: [courseId]
        });

        if (assignments.courses && assignments.courses[0]) {
            const courseAssignments = assignments.courses[0].assignments || [];
            
            // Guardar tareas en la base de datos local
            for (const assignment of courseAssignments) {
                await pool.query(
                    `INSERT INTO moodle_assignments 
                     (assignment_id, course_id, user_id, name, intro, duedate, allowsubmissionsfromdate, cutoffdate, maxattempts) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE 
                     name = VALUES(name), 
                     intro = VALUES(intro), 
                     duedate = VALUES(duedate), 
                     allowsubmissionsfromdate = VALUES(allowsubmissionsfromdate), 
                     cutoffdate = VALUES(cutoffdate), 
                     maxattempts = VALUES(maxattempts)`,
                    [
                        assignment.id,
                        courseId,
                        req.user.id,
                        assignment.name,
                        assignment.intro || '',
                        assignment.duedate ? moment.unix(assignment.duedate).format('YYYY-MM-DD HH:mm:ss') : null,
                        assignment.allowsubmissionsfromdate ? moment.unix(assignment.allowsubmissionsfromdate).format('YYYY-MM-DD HH:mm:ss') : null,
                        assignment.cutoffdate ? moment.unix(assignment.cutoffdate).format('YYYY-MM-DD HH:mm:ss') : null,
                        assignment.maxattempts || -1
                    ]
                );
            }

            res.json({
                success: true,
                assignments: courseAssignments,
                message: `${courseAssignments.length} tareas sincronizadas`
            });
        } else {
            res.json({
                success: true,
                assignments: [],
                message: 'No se encontraron tareas en este curso'
            });
        }
    } catch (error) {
        console.error('Error obteniendo tareas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Sincronizar todas las tareas de Moodle con el calendario local
router.post('/sync-assignments', auth, async (req, res) => {
    try {
        // Obtener todos los cursos del usuario
        const [courses] = await pool.query(
            'SELECT course_id FROM moodle_courses WHERE user_id = ?',
            [req.user.id]
        );

        let totalSynced = 0;
        let totalErrors = 0;

        for (const course of courses) {
            try {
                const assignments = await moodleRequest('mod_assign_get_assignments', {
                    courseids: [course.course_id]
                });

                if (assignments.courses && assignments.courses[0]) {
                    const courseAssignments = assignments.courses[0].assignments || [];
                    
                    for (const assignment of courseAssignments) {
                        if (assignment.duedate) {
                            // Verificar si ya existe en eventos locales
                            const [existing] = await pool.query(
                                'SELECT id FROM eventos WHERE moodle_assignment_id = ? AND usuario_id = ?',
                                [assignment.id, req.user.id]
                            );

                            if (existing.length === 0) {
                                // Crear evento en el calendario local
                                await pool.query(
                                    'INSERT INTO eventos (usuario_id, nombre, tipo, deadline, moodle_assignment_id, moodle_course_id) VALUES (?, ?, ?, ?, ?, ?)',
                                    [
                                        req.user.id,
                                        `[${assignments.courses[0].fullname}] ${assignment.name}`,
                                        'tarea',
                                        moment.unix(assignment.duedate).format('YYYY-MM-DD HH:mm:ss'),
                                        assignment.id,
                                        course.course_id
                                    ]
                                );
                                totalSynced++;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error sincronizando curso ${course.course_id}:`, error);
                totalErrors++;
            }
        }

        res.json({
            success: true,
            message: `Sincronización completada: ${totalSynced} tareas nuevas agregadas, ${totalErrors} errores`,
            synced: totalSynced,
            errors: totalErrors
        });
    } catch (error) {
        console.error('Error en sincronización:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener eventos del calendario de Moodle
router.get('/calendar-events', auth, async (req, res) => {
    try {
        const { start, end } = req.query;
        
        const events = await moodleRequest('core_calendar_get_calendar_events', {
            events: {
                timestart: start ? moment(start).unix() : moment().startOf('month').unix(),
                timend: end ? moment(end).unix() : moment().endOf('month').unix(),
                userevents: 1,
                courseevents: 1,
                groupevents: 0,
                siteevents: 0
            }
        });

        res.json({
            success: true,
            events: events.events || []
        });
    } catch (error) {
        console.error('Error obteniendo eventos del calendario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Configurar credenciales de Moodle
router.post('/config', auth, async (req, res) => {
    try {
        const { moodle_url, moodle_token, moodle_user_id } = req.body;
        
        // Validar credenciales haciendo una petición de prueba
        const testResponse = await moodleRequest('core_webservice_get_site_info', {}, {
            baseURL: moodle_url,
            token: moodle_token
        });

        if (testResponse.errorcode) {
            return res.status(400).json({
                success: false,
                error: 'Credenciales de Moodle inválidas'
            });
        }

        // Guardar configuración en la base de datos
        await pool.query(
            `INSERT INTO user_moodle_config (user_id, moodle_url, moodle_token, moodle_user_id) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             moodle_url = VALUES(moodle_url), 
             moodle_token = VALUES(moodle_token), 
             moodle_user_id = VALUES(moodle_user_id)`,
            [req.user.id, moodle_url, moodle_token, moodle_user_id]
        );

        res.json({
            success: true,
            message: 'Configuración de Moodle guardada exitosamente'
        });
    } catch (error) {
        console.error('Error configurando Moodle:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener configuración actual de Moodle
router.get('/config', auth, async (req, res) => {
    try {
        const [config] = await pool.query(
            'SELECT moodle_url, moodle_user_id FROM user_moodle_config WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            success: true,
            config: config[0] || null
        });
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 