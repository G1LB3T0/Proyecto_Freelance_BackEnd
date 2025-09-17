const { Router } = require('express');
const router = Router();

// Importar middleware de autenticación
const { authMiddleware } = require('../middleware/auth');

// Importar controladores
const {
    getUserSettings,
    updateUserSettings,
    updateSocialLinks,
    changePassword
} = require('../controllers/configuration.controller');

// Rutas protegidas - todas requieren autenticación
router.get('/settings', authMiddleware, getUserSettings);
router.put('/settings', authMiddleware, updateUserSettings);
router.put('/social-links', authMiddleware, updateSocialLinks);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;