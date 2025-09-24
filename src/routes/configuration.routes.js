const { Router } = require('express');
const router = Router();

// Importar middleware de autenticación y roles
const { authMiddleware, anyAuthenticated } = require('../middleware/auth');

// Importar controladores
const {
    getUserSettings,
    updateUserSettings,
    updateSocialLinks,
    changePassword
} = require('../controllers/configuration.controller');

// Rutas protegidas - todas requieren autenticación
router.get('/settings', authMiddleware, anyAuthenticated, getUserSettings);
router.put('/settings', authMiddleware, anyAuthenticated, updateUserSettings);
router.put('/social-links', authMiddleware, anyAuthenticated, updateSocialLinks);
router.post('/change-password', authMiddleware, anyAuthenticated, changePassword);

module.exports = router;