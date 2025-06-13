const jwt = require('jsonwebtoken');
const JWT_SECRET = 'supersecreto';

function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No autorizado' });
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
}
module.exports = authMiddleware; 