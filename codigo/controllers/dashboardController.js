const db = require('../db');

const getDashboardStats = async (req, res) => {
    try {
        // Obtener estadísticas de tareas completadas vs pendientes
        const [completadas] = await db.query(
            'SELECT COUNT(*) as count FROM eventos WHERE completado = TRUE'
        );
        const [pendientes] = await db.query(
            'SELECT COUNT(*) as count FROM eventos WHERE completado = FALSE'
        );

        // Obtener distribución por tipo
        const [tipoStats] = await db.query(
            'SELECT tipo, COUNT(*) as count FROM eventos GROUP BY tipo'
        );

        // Obtener progreso mensual
        const [progresoMensual] = await db.query(
            `SELECT 
                DATE_FORMAT(deadline, '%Y-%m') as mes,
                COUNT(*) as completadas
            FROM eventos 
            WHERE completado = TRUE 
            GROUP BY DATE_FORMAT(deadline, '%Y-%m')
            ORDER BY mes DESC
            LIMIT 6`
        );

        // Obtener exámenes completados y pendientes por mes
        const [examenesMensual] = await db.query(
            `SELECT 
                DATE_FORMAT(deadline, '%Y-%m') as mes,
                SUM(CASE WHEN completado = TRUE THEN 1 ELSE 0 END) as completados,
                SUM(CASE WHEN completado = FALSE THEN 1 ELSE 0 END) as pendientes
            FROM eventos 
            WHERE tipo = 'examen'
            GROUP BY DATE_FORMAT(deadline, '%Y-%m')
            ORDER BY mes DESC
            LIMIT 6`
        );

        // Formatear datos para el frontend
        const stats = {
            completadas: completadas[0].count,
            pendientes: pendientes[0].count,
            tareas: tipoStats.find(s => s.tipo === 'tarea')?.count || 0,
            examenes: tipoStats.find(s => s.tipo === 'examen')?.count || 0,
            proyectos: tipoStats.find(s => s.tipo === 'proyecto')?.count || 0,
            meses: progresoMensual.map(p => p.mes).reverse(),
            progresoMensual: progresoMensual.map(p => p.completadas).reverse(),
            examenesMensual: {
                completados: examenesMensual.map(p => p.completados).reverse(),
                pendientes: examenesMensual.map(p => p.pendientes).reverse()
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
    }
};

module.exports = {
    getDashboardStats
}; 