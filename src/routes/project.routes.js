const { Router } = require('express');
const router = Router();

const {
    getProjects,
    getProjectById,
    getProjectsByClient,
    getProjectsByFreelancer,
    getProjectsByStatus,
    createProject,
    updateProject,
    deleteProject,
    createProposal,
    getProjectProposals,
    getFreelancerProposals,
    acceptProposal,
    rejectProposal,
    createReview,
    getUserReviews
} = require('../controllers/project.Controllers.js');

// === RUTAS DE PROYECTOS ===
router.get("/", getProjects);                                    // GET /projects - Todos los proyectos
router.get("/:id", getProjectById);                              // GET /projects/1 - Proyecto por ID
router.get("/client/:clientId", getProjectsByClient);            // GET /projects/client/1 - Proyectos de un cliente
router.get("/freelancer/:freelancerId", getProjectsByFreelancer); // GET /projects/freelancer/1 - Proyectos de un freelancer
router.get("/status/:status", getProjectsByStatus);              // GET /projects/status/open - Proyectos por estado
router.post("/", createProject);                                 // POST /projects - Crear proyecto
router.put("/:id", updateProject);                               // PUT /projects/1 - Actualizar proyecto
router.delete("/:id", deleteProject);                            // DELETE /projects/1 - Eliminar proyecto

// === RUTAS DE PROPUESTAS ===
router.post("/proposals", createProposal);                       // POST /projects/proposals - Crear propuesta
router.get("/:projectId/proposals", getProjectProposals);        // GET /projects/1/proposals - Propuestas de un proyecto
router.get("/freelancer/:freelancerId/proposals", getFreelancerProposals); // GET /projects/freelancer/1/proposals - Propuestas de un freelancer
router.patch("/proposals/:proposalId/accept", acceptProposal);   // PATCH /projects/proposals/1/accept - Aceptar propuesta
router.patch("/proposals/:proposalId/reject", rejectProposal);   // PATCH /projects/proposals/1/reject - Rechazar propuesta

// === RUTAS DE REVIEWS ===
router.post("/reviews", createReview);                           // POST /projects/reviews - Crear review
router.get("/user/:userId/reviews", getUserReviews);             // GET /projects/user/1/reviews - Reviews de un usuario

module.exports = router;