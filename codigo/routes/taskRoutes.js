const express = require('express');
const router = express.Router();
const { getTareas, addTarea } = require('../controllers/taskController');

router.get('/', getTareas);
router.post('/', addTarea);

module.exports = router;
