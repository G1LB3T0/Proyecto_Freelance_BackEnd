const { Router } = require('express');
const router = Router();

const {
    authMiddleware,
    clientOnly,
    freelancerOnly,
    anyAuthenticated,
    validateParamOwnership
} = require('../middleware/auth');

const {
    getProjects,
    getProjectById,
    getProjectsByClient,
    getProjectsByFreelancer,
    getProjectsByStatus,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/project.Controllers.js');

const {
    createProposal,
    getProjectProposals,
    getFreelancerProposals,
    acceptProposal,
    rejectProposal
} = require('../controllers/proposal.controller.js');

const {
    createReview,
    getUserReviews
} = require('../controllers/review.controller.js');

// === RUTAS DE PROYECTOS ===
router.get('/', authMiddleware, anyAuthenticated, getProjects);
router.get('/client/:clientId', authMiddleware, validateParamOwnership('clientId'), getProjectsByClient);
router.get('/freelancer/:freelancerId/proposals', authMiddleware, validateParamOwnership('freelancerId'), getFreelancerProposals);
router.get('/freelancer/:freelancerId', authMiddleware, validateParamOwnership('freelancerId'), getProjectsByFreelancer);
router.get('/status/:status', authMiddleware, anyAuthenticated, getProjectsByStatus);
router.get('/user/:userId/reviews', getUserReviews);
router.get('/:projectId/proposals', authMiddleware, anyAuthenticated, getProjectProposals);
router.get('/:id', authMiddleware, anyAuthenticated, getProjectById);

router.post('/', authMiddleware, clientOnly, createProject);
router.post('/proposals', authMiddleware, freelancerOnly, createProposal);
router.post('/reviews', authMiddleware, anyAuthenticated, createReview);

router.put('/:id', authMiddleware, clientOnly, updateProject);

router.patch('/proposals/:proposalId/accept', authMiddleware, clientOnly, acceptProposal);
router.patch('/proposals/:proposalId/reject', authMiddleware, clientOnly, rejectProposal);

router.delete('/:id', authMiddleware, clientOnly, deleteProject);

module.exports = router;