const { Router } = require('express');
const router = Router();

const { authMiddleware, anyAuthenticated } = require('../middleware/auth');
const {
  getUserSettings,
  getUserProfile,
  updateUserSettings,
  changePassword,
  uploadAvatar
} = require('../controllers/settings.controller');

// Rutas para settings (compatibles con el servicio frontend)
router.get('/', authMiddleware, anyAuthenticated, getUserSettings);
router.get('/profile', authMiddleware, anyAuthenticated, getUserProfile);
router.put('/', authMiddleware, anyAuthenticated, updateUserSettings);
router.post('/password', authMiddleware, anyAuthenticated, changePassword);
router.post('/avatar', authMiddleware, anyAuthenticated, uploadAvatar);

module.exports = router;
