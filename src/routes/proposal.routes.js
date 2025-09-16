const { Router } = require('express');
const router = Router();
const {
    authMiddleware,
    freelancerOnly,
    clientOnly,
    anyAuthenticated,
    validateParamOwnership
} = require('../middleware/auth'); const {
    createProposal,
    getProjectProposals,
    getFreelancerProposals,
    acceptProposal,
    rejectProposal
} = require('../controllers/proposal.controller.js');

// === RUTAS DE PROPUESTAS ===
router.post('/', authMiddleware, freelancerOnly, createProposal);                              // POST /proposals - Crear propuesta (automáticamente usa req.user.id como freelancer_id)
router.get('/project/:projectId', authMiddleware, anyAuthenticated, getProjectProposals);     // GET /proposals/project/1 - Propuestas de un proyecto (autenticados)
router.get('/freelancer/:freelancerId', authMiddleware, validateParamOwnership('freelancerId'), getFreelancerProposals); // GET /proposals/freelancer/1 - Propuestas de un freelancer (solo propias o admin)
router.patch('/:proposalId/accept', authMiddleware, clientOnly, acceptProposal);              // PATCH /proposals/1/accept - Aceptar propuesta (solo clients/project managers)
router.patch('/:proposalId/reject', authMiddleware, clientOnly, rejectProposal);              // PATCH /proposals/1/reject - Rechazar propuesta (solo clients/project managers)

module.exports = router;
