const express = require('express');
const router = express.Router();
const { getUserStats } = require('../controllers/user.controller');

// TODO: Agregar middleware de autenticación aquí
// const authenticateToken = require('../middleware/auth');

// Obtener estadísticas del usuario autenticado
router.get('/me/stats', getUserStats);

module.exports = router;
