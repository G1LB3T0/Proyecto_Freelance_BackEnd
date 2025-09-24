const express = require('express');
const router = express.Router();
const { getUserStats } = require('../controllers/user.controller');
const { authMiddleware, anyAuthenticated } = require('../middleware/auth');

// Obtener estadísticas del usuario autenticado
router.get('/me/stats', authMiddleware, anyAuthenticated, getUserStats);

module.exports = router;
