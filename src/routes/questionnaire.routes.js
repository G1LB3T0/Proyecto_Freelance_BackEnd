const { Router } = require('express');
const router = Router();
const {
    authMiddleware,
    clientOnly,
    anyAuthenticated
} = require('../middleware/auth');

const {
    saveQuestionnaireResponses,
    getQuestionnaireResponses,
    getUserQuestionnaires,
    linkQuestionnaireToProject
} = require('../controllers/questionnaire.controller');

/**
 * RUTAS DEL CUESTIONARIO DE PROYECTO
 * Endpoints para manejar las respuestas del cuestionario
 * que se llena antes de crear un proyecto
 */

// === ENDPOINTS DE CUESTIONARIO ===

// POST /questionnaire - Guardar/actualizar respuestas del cuestionario
router.post('/', authMiddleware, clientOnly, saveQuestionnaireResponses);

// GET /questionnaire - Obtener respuestas específicas del cuestionario
// Query params: session_id o project_id
router.get('/', authMiddleware, anyAuthenticated, getQuestionnaireResponses);

// GET /questionnaire/my - Listar todos los cuestionarios del usuario
// Query params: page, limit, is_complete
router.get('/my', authMiddleware, anyAuthenticated, getUserQuestionnaires);

// POST /questionnaire/link - Asociar cuestionario existente con proyecto creado
// Body: { session_id, project_id }
router.post('/link', authMiddleware, clientOnly, linkQuestionnaireToProject);

module.exports = router;