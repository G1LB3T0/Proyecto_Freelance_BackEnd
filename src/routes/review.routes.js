const { Router } = require('express');
const router = Router();
const { authMiddleware, anyAuthenticated } = require('../middleware/auth');

const {
    createReview,
    getUserReviews,
    getProjectReviews,
    getUserReviewStats
} = require('../controllers/review.controller.js');

// === RUTAS DE REVIEWS ===
router.post('/', authMiddleware, anyAuthenticated, createReview);                              // POST /reviews - Crear review (usuarios autenticados)
router.get('/user/:userId', getUserReviews);                 // GET /reviews/user/1 - Reviews de un usuario (público)
router.get('/user/:userId/stats', getUserReviewStats);       // GET /reviews/user/1/stats - Estadísticas de reviews (público)
router.get('/project/:projectId', authMiddleware, anyAuthenticated, getProjectReviews);        // GET /reviews/project/1 - Reviews de un proyecto (autenticados)

module.exports = router;
